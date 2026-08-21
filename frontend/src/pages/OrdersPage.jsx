import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { Alert, EmptyState, Spinner, StatusBadge, money } from '../components/Common.jsx';

export default function OrdersPage() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.myOrders().then(setOrders).catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="container"><Alert type="error">{error}</Alert></div>;
  if (!orders) return <div className="container"><Spinner /></div>;

  return (
    <div className="container">
      <h1>My orders</h1>
      {orders.length === 0 ? (
        <EmptyState icon="🧾" title="No orders yet" message="Your placed orders will show up here." />
      ) : (
        <table className="table" data-testid="orders-table">
          <thead>
            <tr>
              <th>Order</th><th>Restaurant</th><th>Items</th>
              <th>Total</th><th>Status</th><th>Placed</th><th />
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>#{o.id}</td>
                <td>{o.restaurant_name}</td>
                <td>{o.item_count}</td>
                <td>{money(o.total_amount)}</td>
                <td><StatusBadge status={o.status} /></td>
                <td>{new Date(o.placed_at).toLocaleString()}</td>
                <td><Link to={`/orders/${o.id}`} className="btn btn-ghost">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
