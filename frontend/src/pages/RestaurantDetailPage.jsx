import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import { Alert, Spinner, money } from '../components/Common.jsx';

export default function RestaurantDetailPage() {
  const { id } = useParams();
  const { addItem, itemCount } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    Promise.all([api.getRestaurant(id), api.getMenu(id)])
      .then(([r, m]) => { setRestaurant(r); setMenu(m); })
      .catch((err) => setError(err.message));
  }, [id]);

  const handleAdd = (item) => {
    addItem(restaurant, item, 1);
    setNotice(`${item.name} added to your cart`);
    setTimeout(() => setNotice(''), 2500);
  };

  if (error) return <div className="container"><Alert type="error">{error}</Alert></div>;
  if (!restaurant) return <div className="container"><Spinner /></div>;

  const categories = [...new Set(menu.map((i) => i.category))];

  return (
    <div className="container">
      <Link to="/" className="back-link">← All restaurants</Link>

      <section className="restaurant-header">
        <div>
          <h1>{restaurant.name}</h1>
          <p className="muted">{restaurant.description}</p>
          <div className="card-meta">
            <span>🍽️ {restaurant.cuisine}</span>
            <span>★ {Number(restaurant.rating).toFixed(1)}</span>
            <span>📍 {restaurant.address}</span>
            <span>🛵 {money(restaurant.delivery_fee)} delivery</span>
            <span className={`open-tag ${restaurant.is_open ? 'open' : 'closed'}`}>
              {restaurant.is_open ? 'Open now' : 'Closed'}
            </span>
          </div>
        </div>
        {itemCount > 0 && (
          <Link to="/cart" className="btn btn-primary">View cart ({itemCount})</Link>
        )}
      </section>

      {notice && <Alert type="success">{notice}</Alert>}

      {categories.map((category) => (
        <section key={category} className="menu-section">
          <h2>{category}</h2>
          <div className="menu-list">
            {menu.filter((i) => i.category === category).map((item) => (
              <article key={item.id} className="menu-item" data-testid="menu-item">
                <div>
                  <h4>{item.name}</h4>
                  <p className="muted">{item.description}</p>
                  {!item.is_available && <span className="muted">Currently unavailable</span>}
                </div>
                <div className="menu-item-actions">
                  <span className="price">{money(item.price)}</span>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!item.is_available || !restaurant.is_open}
                    onClick={() => handleAdd(item)}
                  >
                    Add
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
