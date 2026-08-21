import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { signToken } from '../../utils/jwt.js';

const PUBLIC_COLUMNS = 'id, full_name, email, phone, address, role, created_at';

/** Creates a new account and returns the user together with an access token. */
export async function register({ fullName, email, password, phone, address, role }) {
  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rowCount > 0) {
    throw ApiError.conflict('An account with this email address already exists');
  }

  const passwordHash = await hashPassword(password);
  const { rows } = await query(
    `INSERT INTO users (full_name, email, password_hash, phone, address, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${PUBLIC_COLUMNS}`,
    [fullName, email, passwordHash, phone || null, address || null, role]
  );

  const user = rows[0];
  return { user, token: signToken(user) };
}

/** Verifies credentials and issues an access token. */
export async function login({ email, password }) {
  const { rows } = await query(
    `SELECT ${PUBLIC_COLUMNS}, password_hash FROM users WHERE email = $1`,
    [email]
  );

  if (rows.length === 0) throw ApiError.unauthorized('Invalid email or password');

  const { password_hash: passwordHash, ...user } = rows[0];
  const matches = await verifyPassword(password, passwordHash);
  if (!matches) throw ApiError.unauthorized('Invalid email or password');

  return { user, token: signToken(user) };
}

/** Returns the profile of the currently authenticated user. */
export async function getProfile(userId) {
  const { rows } = await query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`, [userId]);
  if (rows.length === 0) throw ApiError.notFound('User not found');
  return rows[0];
}
