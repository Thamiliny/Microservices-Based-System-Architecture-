/** Small presentational helpers shared by several pages. */

export const money = (value) =>
  `Rs. ${Number(value || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function Spinner({ label = 'Loading…' }) {
  return <div className="spinner" role="status"><span /> {label}</div>;
}

export function Alert({ type = 'info', children }) {
  if (!children) return null;
  return <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>{children}</div>;
}

export function StatusBadge({ status }) {
  return <span className={`status status-${status}`}>{status.replace(/_/g, ' ')}</span>;
}

export function EmptyState({ icon = '🍽️', title, message }) {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">{icon}</div>
      <h3>{title}</h3>
      <p className="muted">{message}</p>
    </div>
  );
}
