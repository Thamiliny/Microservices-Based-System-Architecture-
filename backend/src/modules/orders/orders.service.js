import { query, withTransaction } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';

/**
 * Legal order status transitions. The API refuses any move that is not
 * listed here, so an order can never jump from PENDING straight to DELIVERED.
 */
export const STATUS_FLOW = {
  PENDING:          ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:        ['PREPARING', 'CANCELLED'],
  PREPARING:        ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED:        [],
  CANCELLED:        []
};

/**
 * Places an order inside a single transaction.
 *
 * Prices are read from the database (never trusted from the client) and are
 * snapshotted onto `order_items`, so later menu price changes do not rewrite
 * the history of past orders.
 */
export async function create(customerId, payload) {
  return withTransaction(async (client) => {
    const restaurantResult = await client.query(
      'SELECT id, name, delivery_fee, is_open FROM restaurants WHERE id = $1',
      [payload.restaurantId]
    );
    if (restaurantResult.rows.length === 0) {
      throw ApiError.notFound(`Restaurant ${payload.restaurantId} not found`);
    }
    const restaurant = restaurantResult.rows[0];
    if (!restaurant.is_open) {
      throw ApiError.badRequest(`${restaurant.name} is currently closed`);
    }

    // Merge duplicate lines so the (order_id, menu_item_id) unique key holds.
    const quantities = new Map();
    for (const item of payload.items) {
      quantities.set(item.menuItemId, (quantities.get(item.menuItemId) || 0) + item.quantity);
    }
    const menuItemIds = [...quantities.keys()];

    const menuResult = await client.query(
      `SELECT id, name, price, is_available, restaurant_id
         FROM menu_items WHERE id = ANY($1::int[])`,
      [menuItemIds]
    );

    if (menuResult.rows.length !== menuItemIds.length) {
      const found = new Set(menuResult.rows.map((r) => r.id));
      const missing = menuItemIds.filter((id) => !found.has(id));
      throw ApiError.badRequest(`Unknown menu item(s): ${missing.join(', ')}`);
    }

    let subtotal = 0;
    const lines = menuResult.rows.map((row) => {
      if (row.restaurant_id !== restaurant.id) {
        throw ApiError.badRequest(
          `Menu item "${row.name}" does not belong to ${restaurant.name}`
        );
      }
      if (!row.is_available) {
        throw ApiError.badRequest(`"${row.name}" is currently unavailable`);
      }
      const quantity = quantities.get(row.id);
      const unitPrice = Number(row.price);
      const lineTotal = Number((unitPrice * quantity).toFixed(2));
      subtotal += lineTotal;
      return { menuItemId: row.id, name: row.name, unitPrice, quantity, lineTotal };
    });

    subtotal = Number(subtotal.toFixed(2));
    const deliveryFee = Number(restaurant.delivery_fee);
    const totalAmount = Number((subtotal + deliveryFee).toFixed(2));

    const orderResult = await client.query(
      `INSERT INTO orders (customer_id, restaurant_id, subtotal, delivery_fee, total_amount,
                           delivery_address, contact_phone, payment_method, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [customerId, restaurant.id, subtotal, deliveryFee, totalAmount,
       payload.deliveryAddress, payload.contactPhone || null,
       payload.paymentMethod, payload.notes || null]
    );
    const orderId = orderResult.rows[0].id;

    for (const line of lines) {
      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity, line_total)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, line.menuItemId, line.name, line.unitPrice, line.quantity, line.lineTotal]
      );
    }

    return getById(orderId, client);
  });
}

/** Loads a full order with its line items. Accepts an optional transaction client. */
export async function getById(orderId, client = null) {
  const run = client ? (text, params) => client.query(text, params) : query;

  const { rows } = await run(
    `SELECT o.*, r.name AS restaurant_name, u.full_name AS customer_name, u.email AS customer_email
       FROM orders o
       JOIN restaurants r ON r.id = o.restaurant_id
       JOIN users u       ON u.id = o.customer_id
      WHERE o.id = $1`,
    [orderId]
  );
  if (rows.length === 0) throw ApiError.notFound(`Order ${orderId} not found`);

  const itemsResult = await run(
    `SELECT id, menu_item_id, item_name, unit_price, quantity, line_total
       FROM order_items WHERE order_id = $1 ORDER BY id`,
    [orderId]
  );

  return { ...rows[0], items: itemsResult.rows };
}

/** Orders belonging to one customer, newest first. */
export async function listByCustomer(customerId) {
  const { rows } = await query(
    `SELECT o.id, o.status, o.subtotal, o.delivery_fee, o.total_amount, o.placed_at,
            o.delivery_address, o.payment_method,
            r.id AS restaurant_id, r.name AS restaurant_name,
            COUNT(oi.id)::int AS item_count
       FROM orders o
       JOIN restaurants r      ON r.id = o.restaurant_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.customer_id = $1
      GROUP BY o.id, r.id
      ORDER BY o.placed_at DESC`,
    [customerId]
  );
  return rows;
}

/** Orders received by one restaurant, newest first. */
export async function listByRestaurant(restaurantId) {
  const { rows } = await query(
    `SELECT o.id, o.status, o.total_amount, o.placed_at, o.delivery_address,
            u.full_name AS customer_name, u.email AS customer_email,
            COUNT(oi.id)::int AS item_count
       FROM orders o
       JOIN users u             ON u.id = o.customer_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.restaurant_id = $1
      GROUP BY o.id, u.id
      ORDER BY o.placed_at DESC`,
    [restaurantId]
  );
  return rows;
}

/** Applies a status change, rejecting transitions that are not allowed. */
export async function updateStatus(orderId, nextStatus) {
  const current = await query('SELECT status FROM orders WHERE id = $1', [orderId]);
  if (current.rows.length === 0) throw ApiError.notFound(`Order ${orderId} not found`);

  const currentStatus = current.rows[0].status;
  if (!STATUS_FLOW[currentStatus].includes(nextStatus)) {
    throw ApiError.badRequest(
      `Cannot move an order from ${currentStatus} to ${nextStatus}. ` +
      `Allowed next states: ${STATUS_FLOW[currentStatus].join(', ') || 'none (final state)'}`
    );
  }

  await query('UPDATE orders SET status = $1 WHERE id = $2', [nextStatus, orderId]);
  return getById(orderId);
}

/**
 * Access control for a single order: the customer who placed it, the owner of
 * the restaurant it was sent to, or an admin.
 */
export async function assertCanView(order, user) {
  if (user.role === 'admin') return;
  if (order.customer_id === user.id) return;

  const { rows } = await query('SELECT owner_id FROM restaurants WHERE id = $1', [order.restaurant_id]);
  if (rows.length > 0 && rows[0].owner_id === user.id) return;

  throw ApiError.forbidden('You do not have access to this order');
}
