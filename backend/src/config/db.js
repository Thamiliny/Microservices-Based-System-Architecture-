import pg from 'pg';
import { config } from './env.js';

const { Pool } = pg;

/**
 * PostgreSQL connection pool.
 *
 * Inside Docker Compose `DB_HOST` resolves to the `db` service name through
 * the user-defined bridge network, so no ports have to be published for the
 * backend to reach the database.
 */
export const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
  max: config.db.poolMax,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000
});

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('[db] unexpected error on idle client', err);
});

/** Runs a parameterised query against the pool. */
export function query(text, params) {
  return pool.query(text, params);
}

/**
 * Runs `fn` inside a transaction, committing on success and rolling back on
 * any thrown error. Used when placing an order (orders + order_items).
 */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Blocks until the database accepts connections (used at boot time). */
export async function waitForDatabase({ retries = 15, delayMs = 2000 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch (err) {
      if (attempt === retries) throw err;
      // eslint-disable-next-line no-console
      console.log(`[db] not ready (attempt ${attempt}/${retries}) - retrying in ${delayMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return false;
}
