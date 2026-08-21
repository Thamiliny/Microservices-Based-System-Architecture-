import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';

const COLUMNS = `id, restaurant_id, name, description, price, category,
                 image_url, is_available, created_at`;

export async function listByRestaurant(restaurantId, { availableOnly } = {}) {
  const where = availableOnly ? 'AND is_available = TRUE' : '';
  const { rows } = await query(
    `SELECT ${COLUMNS} FROM menu_items
      WHERE restaurant_id = $1 ${where}
      ORDER BY category, name`,
    [restaurantId]
  );
  return rows;
}

export async function getById(id) {
  const { rows } = await query(`SELECT ${COLUMNS} FROM menu_items WHERE id = $1`, [id]);
  if (rows.length === 0) throw ApiError.notFound(`Menu item ${id} not found`);
  return rows[0];
}

export async function create(restaurantId, payload) {
  const { rows } = await query(
    `INSERT INTO menu_items (restaurant_id, name, description, price, category, image_url, is_available)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${COLUMNS}`,
    [restaurantId, payload.name, payload.description || null, payload.price,
     payload.category, payload.imageUrl || null, payload.isAvailable]
  );
  return rows[0];
}

export async function update(id, payload) {
  const { rows } = await query(
    `UPDATE menu_items
        SET name         = COALESCE($1, name),
            description  = COALESCE($2, description),
            price        = COALESCE($3, price),
            category     = COALESCE($4, category),
            image_url    = COALESCE($5, image_url),
            is_available = COALESCE($6, is_available)
      WHERE id = $7
      RETURNING ${COLUMNS}`,
    [payload.name ?? null, payload.description ?? null, payload.price ?? null,
     payload.category ?? null, payload.imageUrl ?? null, payload.isAvailable ?? null, id]
  );
  if (rows.length === 0) throw ApiError.notFound(`Menu item ${id} not found`);
  return rows[0];
}

export async function remove(id) {
  const { rowCount } = await query('DELETE FROM menu_items WHERE id = $1', [id]);
  if (rowCount === 0) throw ApiError.notFound(`Menu item ${id} not found`);
}
