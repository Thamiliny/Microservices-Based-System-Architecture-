import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';

const COLUMNS = `id, owner_id, name, description, cuisine, address, phone,
                 image_url, rating, delivery_fee, is_open, created_at`;

/** Paginated, filterable restaurant listing. */
export async function list({ search, cuisine, openOnly, limit, offset }) {
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`);
  }
  if (cuisine) {
    params.push(cuisine);
    conditions.push(`cuisine = $${params.length}`);
  }
  if (openOnly === 'true') {
    conditions.push('is_open = TRUE');
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(limit, offset);

  const { rows } = await query(
    `SELECT ${COLUMNS} FROM restaurants ${where}
      ORDER BY rating DESC, name ASC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM restaurants ${where}`,
    params.slice(0, params.length - 2)
  );

  return { items: rows, total: countResult.rows[0].total, limit, offset };
}

export async function getById(id) {
  const { rows } = await query(`SELECT ${COLUMNS} FROM restaurants WHERE id = $1`, [id]);
  if (rows.length === 0) throw ApiError.notFound(`Restaurant ${id} not found`);
  return rows[0];
}

export async function create(payload, ownerId) {
  const { rows } = await query(
    `INSERT INTO restaurants (owner_id, name, description, cuisine, address, phone,
                              image_url, delivery_fee, is_open)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING ${COLUMNS}`,
    [ownerId, payload.name, payload.description || null, payload.cuisine, payload.address,
     payload.phone || null, payload.imageUrl || null, payload.deliveryFee, payload.isOpen]
  );
  return rows[0];
}

/** Ensures the caller owns the restaurant (admins bypass the check). */
export async function assertCanManage(restaurantId, user) {
  const restaurant = await getById(restaurantId);
  if (user.role === 'admin') return restaurant;
  if (restaurant.owner_id !== user.id) {
    throw ApiError.forbidden('You can only manage restaurants that you own');
  }
  return restaurant;
}

export async function update(id, payload) {
  const { rows } = await query(
    `UPDATE restaurants
        SET name         = COALESCE($1, name),
            description  = COALESCE($2, description),
            cuisine      = COALESCE($3, cuisine),
            address      = COALESCE($4, address),
            phone        = COALESCE($5, phone),
            image_url    = COALESCE($6, image_url),
            delivery_fee = COALESCE($7, delivery_fee),
            is_open      = COALESCE($8, is_open)
      WHERE id = $9
      RETURNING ${COLUMNS}`,
    [payload.name ?? null, payload.description ?? null, payload.cuisine ?? null,
     payload.address ?? null, payload.phone ?? null, payload.imageUrl ?? null,
     payload.deliveryFee ?? null, payload.isOpen ?? null, id]
  );
  if (rows.length === 0) throw ApiError.notFound(`Restaurant ${id} not found`);
  return rows[0];
}

export async function remove(id) {
  const { rowCount } = await query('DELETE FROM restaurants WHERE id = $1', [id]);
  if (rowCount === 0) throw ApiError.notFound(`Restaurant ${id} not found`);
}

/** Distinct cuisine list, used by the frontend filter bar. */
export async function cuisines() {
  const { rows } = await query('SELECT DISTINCT cuisine FROM restaurants ORDER BY cuisine');
  return rows.map((r) => r.cuisine);
}
