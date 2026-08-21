import { Router } from 'express';
import { pool } from '../../config/db.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

/** Liveness probe - does not touch the database. */
router.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'UP',
      service: 'food-delivery-backend',
      version: '1.0.0',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString()
    }
  });
});

/** Readiness probe - proves the API can actually reach PostgreSQL. */
router.get('/db', asyncHandler(async (_req, res) => {
  const started = Date.now();
  const { rows } = await pool.query('SELECT NOW() AS server_time, version() AS version');
  const tables = await pool.query(
    `SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name`
  );

  res.json({
    success: true,
    data: {
      database: 'CONNECTED',
      latencyMs: Date.now() - started,
      serverTime: rows[0].server_time,
      version: rows[0].version.split(',')[0],
      tables: tables.rows.map((r) => r.table_name),
      pool: { total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount }
    }
  });
}));

export default router;
