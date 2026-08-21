/**
 * Container HEALTHCHECK probe.
 * Uses only the Node standard library, so no extra packages are needed
 * in the runtime image.
 */
import http from 'node:http';

const port = process.env.PORT || 4000;

const req = http.get({ host: '127.0.0.1', port, path: '/api/health', timeout: 4000 }, (res) => {
  process.exit(res.statusCode === 200 ? 0 : 1);
});

req.on('error', () => process.exit(1));
req.on('timeout', () => { req.destroy(); process.exit(1); });
