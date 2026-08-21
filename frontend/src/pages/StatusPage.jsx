import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Alert, Spinner } from '../components/Common.jsx';

/**
 * Diagnostics page: proves in the browser that the frontend container reaches
 * the backend container, and that the backend reaches PostgreSQL.
 */
export default function StatusPage() {
  const [health, setHealth] = useState(null);
  const [db, setDb] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    Promise.all([api.health(), api.healthDb()])
      .then(([h, d]) => { setHealth(h); setDb(d); })
      .catch((err) => setError(err.message));
  };

  useEffect(load, []);

  return (
    <div className="container">
      <h1>System status</h1>
      <p className="muted">
        The browser calls <code>/api/health</code>; nginx proxies it to the backend
        container, which in turn queries the PostgreSQL container.
      </p>

      <Alert type="error">{error}</Alert>
      <button type="button" className="btn btn-ghost" onClick={load}>Re-check</button>

      <div className="checkout-layout">
        <section className="panel">
          <h2>Backend API</h2>
          {!health ? <Spinner /> : (
            <dl className="detail-list" data-testid="health-api">
              <dt>Status</dt><dd><span className="status status-DELIVERED">{health.status}</span></dd>
              <dt>Service</dt><dd>{health.service}</dd>
              <dt>Version</dt><dd>{health.version}</dd>
              <dt>Uptime</dt><dd>{health.uptimeSeconds}s</dd>
              <dt>Checked at</dt><dd>{new Date(health.timestamp).toLocaleString()}</dd>
            </dl>
          )}
        </section>

        <section className="panel">
          <h2>PostgreSQL database</h2>
          {!db ? <Spinner /> : (
            <dl className="detail-list" data-testid="health-db">
              <dt>Connection</dt><dd><span className="status status-DELIVERED">{db.database}</span></dd>
              <dt>Query latency</dt><dd>{db.latencyMs} ms</dd>
              <dt>Server version</dt><dd>{db.version}</dd>
              <dt>Pool</dt><dd>{db.pool.total} total / {db.pool.idle} idle / {db.pool.waiting} waiting</dd>
              <dt>Tables</dt><dd>{db.tables.join(', ')}</dd>
            </dl>
          )}
        </section>
      </div>
    </div>
  );
}
