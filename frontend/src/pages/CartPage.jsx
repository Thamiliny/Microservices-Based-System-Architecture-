import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { Alert, EmptyState, money } from '../components/Common.jsx';

export default function CartPage() {
  const { cart, setQuantity, removeItem, clear, subtotal, deliveryFee, total } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress] = useState(user?.address || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState('CASH_ON_DELIVERY');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const placeOrder = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const order = await api.createOrder({
        restaurantId: cart.restaurant.id,
        items: cart.items.map((i) => ({ menuItemId: i.id, quantity: i.quantity })),
        deliveryAddress: address,
        contactPhone: phone || undefined,
        paymentMethod,
        notes: notes || undefined
      });
      clear();
      navigate(`/orders/${order.id}`, { state: { justPlaced: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="container">
        <h1>Your cart</h1>
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          message="Pick a restaurant and add a few dishes to get started."
        />
        <Link to="/" className="btn btn-primary">Browse restaurants</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Your cart</h1>
      <p className="muted">Ordering from <strong>{cart.restaurant?.name}</strong></p>

      <div className="checkout-layout">
        <section className="panel">
          <h2>Items</h2>
          <table className="table" data-testid="cart-table">
            <thead>
              <tr><th>Item</th><th>Unit price</th><th>Qty</th><th>Line total</th><th /></tr>
            </thead>
            <tbody>
              {cart.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{money(item.price)}</td>
                  <td>
                    <div className="qty-control">
                      <button type="button" onClick={() => setQuantity(item.id, item.quantity - 1)}>−</button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => setQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                  </td>
                  <td>{money(item.price * item.quantity)}</td>
                  <td>
                    <button type="button" className="btn btn-ghost" onClick={() => removeItem(item.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="totals">
            <div><span>Subtotal</span><span>{money(subtotal)}</span></div>
            <div><span>Delivery fee</span><span>{money(deliveryFee)}</span></div>
            <div className="grand"><span>Total</span><span data-testid="cart-total">{money(total)}</span></div>
          </div>
        </section>

        <section className="panel">
          <h2>Checkout</h2>
          {!isAuthenticated ? (
            <>
              <Alert type="info">You need an account to place an order.</Alert>
              <Link to="/login" className="btn btn-primary">Log in to continue</Link>
            </>
          ) : (
            <form onSubmit={placeOrder} className="form">
              <Alert type="error">{error}</Alert>

              <label>
                Delivery address
                <textarea
                  required minLength={5} rows={3}
                  value={address} onChange={(e) => setAddress(e.target.value)}
                  placeholder="House number, street, city"
                  data-testid="address-input"
                />
              </label>

              <label>
                Contact phone
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+94 …" />
              </label>

              <label>
                Payment method
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="CASH_ON_DELIVERY">Cash on delivery</option>
                  <option value="CARD">Card</option>
                </select>
              </label>

              <label>
                Notes for the kitchen
                <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
              </label>

              <button type="submit" className="btn btn-primary btn-block" disabled={submitting}
                      data-testid="place-order">
                {submitting ? 'Placing order…' : `Place order · ${money(total)}`}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
