import { createApp } from './app.js';
import { config } from './config/env.js';
import { pool, waitForDatabase } from './config/db.js';

const app = createApp();

async function start() {
  // eslint-disable-next-line no-console
  console.log(`[boot] waiting for PostgreSQL at ${config.db.host}:${config.db.port} ...`);
  await waitForDatabase();
  // eslint-disable-next-line no-console
  console.log('[boot] database connection established');

  const server = app.listen(config.port, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`[boot] Food Delivery API listening on port ${config.port} (${config.env})`);
  });

  /** Closes the HTTP server and the connection pool on container shutdown. */
  const shutdown = (signal) => {
    // eslint-disable-next-line no-console
    console.log(`[shutdown] received ${signal}, closing gracefully`);
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[boot] failed to start:', err);
  process.exit(1);
});
