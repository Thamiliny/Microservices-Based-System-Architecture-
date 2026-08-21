import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { Alert, Spinner, StatusBadge, money } from '../components/Common.jsx';

const TIMELINE = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];

export default function OrderDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getOrder(id).then(setOrder).catch((err) => setError(err.message));
  }, [id]);

  if (error) return <div className="container"><Alert type="error">{error}</Alert></div>;
  if (!order) return <div className="container"><Spinner /></div>;

  const currentIndex = TIMELINE.indexOf(order.status);

  return (
    <div className="container">
      <Link to="/orders" className="back-link">← My orders</Link>

      {location.state?.justPlaced && (
        <Alert type="success">
          Your order was placed successfully and sent to {order.restaurant_name}.
        </Alert>
      )}

      <section className="order-header">
        <div>
          <h1>Order #{order.id}</h1>
          <p className="muted">
            {order.restaurant_name} · placed {new Date(order.placed_at).toLocaleString()}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </section>

      {order.status !== 'CANCELLED' && (
        <ol className="timeline" data-testid="order-timeline">
          {TIMELINE.map((step, index) => (
            <li key={step} className={index <= currentIndex ? 'done' : ''}>
              <span className="dot" />
              {step.replace(/_/g, ' ')}
            </li>
          ))}
        </ol>
      )}

      <div className="checkout-layout">
        <section className="panel">
          <h2>Items</h2>
          <table className="table">
            <thead><tr><th>Item</th><th>Unit price</th><th>Qty</th><th>Line total</th></tr></thead>
            <tbody>
              {order.items.map((i) => (
                <tr key={i.id}>
                  <td>{i.item_name}</td>
                  <td>{money(i.unit_price)}</td>
                  <td>{i.quantity}</td>
                  <td>{money(i.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="totals">
            <div><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
            <div><span>Delivery fee</span><span>{money(order.delivery_fee)}</span></div>
            <div className="grand"><span>Total</span><span>{money(order.total_amount)}</span></div>
          </div>
        </section>

        <section className="panel">
          <h2>Delivery</h2>
          <dl className="detail-list">
            <dt>Address</dt><dd>{order.delivery_address}</dd>
            <dt>Contact</dt><dd>{order.contact_phone || '—'}</dd>
            <dt>Payment</dt><dd>{order.payment_method.replace(/_/g, ' ')}</dd>
            <dt>Notes</dt><dd>{order.notes || '—'}</dd>
            <dt>Customer</dt><dd>{order.customer_name}</dd>
          </dl>
        </section>
      </div>
    </div>
  );
}
