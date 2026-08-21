import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, EmptyState, Spinner, StatusBadge, money } from '../components/Common.jsx';

/** Mirrors the STATUS_FLOW map enforced by the backend. */
const NEXT_STATUS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: []
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    api.listRestaurants({ limit: 100 })
      .then((result) => {
        const mine = user.role === 'admin'
          ? result.items
          : result.items.filter((r) => r.owner_id === user.id);
        setRestaurants(mine);
        if (mine.length > 0) setSelectedId(String(mine[0].id));
      })
      .catch((err) => setError(err.message));
  }, [user]);

  const loadOrders = useCallback(() => {
    if (!selectedId) return;
    setOrders(null);
    api.restaurantOrders(selectedId)
      .then(setOrders)
      .catch((err) => setError(err.message));
  }, [selectedId]);

  useEffect(loadOrders, [loadOrders]);

  const advance = async (orderId, status) => {
    setBusyId(orderId);
    setError('');
    try {
      await api.updateOrderStatus(orderId, status);
      loadOrders();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const revenue = (orders || [])
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);
  const pending = (orders || []).filter((o) => o.status === 'PENDING').length;

  return (
    <div className="container">
      <h1>Restaurant dashboard</h1>
      <p className="muted">Accept incoming orders and move them through the delivery workflow.</p>

      <Alert type="error">{error}</Alert>

      {restaurants.length === 0 ? (
        <EmptyState icon="🏪" title="No restaurants linked to this account"
                    message="Restaurants you own will appear here." />
      ) : (
        <>
          <div className="filter-bar">
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
                    aria-label="Select restaurant" data-testid="dashboard-restaurant">
              {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <button type="button" className="btn btn-ghost" onClick={loadOrders}>Refresh</button>
          </div>

          <div className="stat-row">
            <div className="stat"><span>Total orders</span><strong>{orders?.length ?? '—'}</strong></div>
            <div className="stat"><span>Awaiting confirmation</span><strong>{orders ? pending : '—'}</strong></div>
            <div className="stat"><span>Revenue</span><strong>{orders ? money(revenue) : '—'}</strong></div>
          </div>

          {!orders ? <Spinner label="Loading orders…" /> : (
            orders.length === 0 ? (
              <EmptyState icon="📭" title="No orders yet"
                          message="Incoming customer orders will be listed here." />
            ) : (
              <table className="table" data-testid="dashboard-orders">
                <thead>
                  <tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th>
                      <th>Status</th><th>Placed</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td>#{o.id}</td>
                      <td>{o.customer_name}<br /><small className="muted">{o.customer_email}</small></td>
                      <td>{o.item_count}</td>
                      <td>{money(o.total_amount)}</td>
                      <td><StatusBadge status={o.status} /></td>
                      <td>{new Date(o.placed_at).toLocaleString()}</td>
                      <td>
                        <div className="action-group">
                          {NEXT_STATUS[o.status].length === 0
                            ? <span className="muted">—</span>
                            : NEXT_STATUS[o.status].map((next) => (
                                <button key={next} type="button" disabled={busyId === o.id}
                                        className={`btn ${next === 'CANCELLED' ? 'btn-ghost' : 'btn-primary'}`}
                                        onClick={() => advance(o.id, next)}>
                                  {next.replace(/_/g, ' ')}
                                </button>
                              ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </>
      )}
    </div>
  );
}
