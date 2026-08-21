/**
 * Integration tests for the Food Delivery API.
 *
 * These run against the real PostgreSQL container (the same database the
 * application uses), so they exercise the full stack: HTTP -> Express ->
 * service layer -> SQL.
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { pool } from '../src/config/db.js';

jest.setTimeout(30_000);

const app = createApp();
const unique = Date.now();

const customer = {
  fullName: 'Test Customer',
  email: `test.customer.${unique}@example.com`,
  password: 'TestPass@123',
  phone: '+94 77 000 0000',
  address: '1 Test Road, Colombo',
  role: 'customer'
};

let customerToken;
let ownerToken;
let restaurantId;
let menuItems;
let createdOrderId;

afterAll(async () => {
  await pool.end();
});

describe('Health endpoints', () => {
  test('GET /api/health reports the service as UP', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('UP');
  });

  test('GET /api/health/db proves the database connection', async () => {
    const res = await request(app).get('/api/health/db');
    expect(res.status).toBe(200);
    expect(res.body.data.database).toBe('CONNECTED');
    expect(res.body.data.tables).toEqual(
      expect.arrayContaining(['users', 'restaurants', 'menu_items', 'orders', 'order_items'])
    );
  });
});

describe('Authentication', () => {
  test('registers a new customer and returns a JWT', async () => {
    const res = await request(app).post('/api/auth/register').send(customer);
    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe(customer.email);
    expect(res.body.data.user.role).toBe('customer');
    expect(res.body.data.user).not.toHaveProperty('password_hash');
    expect(typeof res.body.data.token).toBe('string');
    customerToken = res.body.data.token;
  });

  test('rejects a duplicate email address with 409', async () => {
    const res = await request(app).post('/api/auth/register').send(customer);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('rejects a weak password with a validation error', async () => {
    const res = await request(app).post('/api/auth/register').send({
      ...customer, email: `weak.${unique}@example.com`, password: 'short'
    });
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].field).toBe('password');
  });

  test('logs a seeded restaurant owner in', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'owner.spice@example.com', password: 'Owner@123' });
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('owner');
    ownerToken = res.body.data.token;
  });

  test('rejects a wrong password with 401', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'owner.spice@example.com', password: 'WrongPassword1' });
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me returns the profile for a valid token', async () => {
    const res = await request(app).get('/api/auth/me')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(customer.email);
  });

  test('GET /api/auth/me is refused without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('Restaurants and menus', () => {
  test('lists seeded restaurants', async () => {
    const res = await request(app).get('/api/restaurants');
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBeGreaterThanOrEqual(4);
    restaurantId = res.body.data.items.find((r) => r.name === 'Spice Garden').id;
  });

  test('filters restaurants by cuisine', async () => {
    const res = await request(app).get('/api/restaurants?cuisine=Italian');
    expect(res.status).toBe(200);
    expect(res.body.data.items.every((r) => r.cuisine === 'Italian')).toBe(true);
  });

  test('returns 404 for an unknown restaurant', async () => {
    const res = await request(app).get('/api/restaurants/999999');
    expect(res.status).toBe(404);
  });

  test('returns the menu of a restaurant', async () => {
    const res = await request(app).get(`/api/restaurants/${restaurantId}/menu`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    menuItems = res.body.data;
  });

  test('refuses restaurant creation for a customer (role check)', async () => {
    const res = await request(app).post('/api/restaurants')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ name: 'Hacked Diner', cuisine: 'Test', address: '1 Nowhere Street' });
    expect(res.status).toBe(403);
  });
});

describe('Order lifecycle', () => {
  test('places an order and computes the totals server-side', async () => {
    const [first, second] = menuItems;
    const res = await request(app).post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        restaurantId,
        items: [
          { menuItemId: first.id, quantity: 2 },
          { menuItemId: second.id, quantity: 1 }
        ],
        deliveryAddress: '1 Test Road, Colombo',
        contactPhone: '+94 77 000 0000',
        paymentMethod: 'CASH_ON_DELIVERY'
      });

    expect(res.status).toBe(201);
    const order = res.body.data;
    createdOrderId = order.id;

    const expectedSubtotal = Number(first.price) * 2 + Number(second.price);
    expect(Number(order.subtotal)).toBeCloseTo(expectedSubtotal, 2);
    expect(Number(order.total_amount)).toBeCloseTo(expectedSubtotal + Number(order.delivery_fee), 2);
    expect(order.status).toBe('PENDING');
    expect(order.items).toHaveLength(2);
  });

  test('rejects an order containing an item from another restaurant', async () => {
    const otherMenu = await request(app).get('/api/restaurants/2/menu');
    const res = await request(app).post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        restaurantId,
        items: [{ menuItemId: otherMenu.body.data[0].id, quantity: 1 }],
        deliveryAddress: '1 Test Road, Colombo'
      });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/does not belong/i);
  });

  test('rejects an empty order', async () => {
    const res = await request(app).post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ restaurantId, items: [], deliveryAddress: '1 Test Road, Colombo' });
    expect(res.status).toBe(400);
  });

  test('lists the order in the customer history', async () => {
    const res = await request(app).get('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((o) => o.id === createdOrderId)).toBe(true);
  });

  test('refuses an illegal status transition (PENDING -> DELIVERED)', async () => {
    const res = await request(app).patch(`/api/orders/${createdOrderId}/status`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'DELIVERED' });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/Cannot move an order/);
  });

  test('walks the order through its full lifecycle', async () => {
    const flow = ['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    for (const status of flow) {
      const res = await request(app).patch(`/api/orders/${createdOrderId}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(status);
    }
  });

  test('refuses a status change from a customer', async () => {
    const res = await request(app).patch(`/api/orders/${createdOrderId}/status`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ status: 'CANCELLED' });
    expect(res.status).toBe(403);
  });
});

describe('Error handling', () => {
  test('unknown routes return a structured 404', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/does not exist/);
  });
});
