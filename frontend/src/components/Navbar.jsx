import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true">🍔</span>
          <span>
            <strong>QuickBite</strong>
            <em>Food Delivery System</em>
          </span>
        </Link>

        <nav className="nav-links">
          <NavLink to="/" end>Restaurants</NavLink>
          {isAuthenticated && <NavLink to="/orders">My Orders</NavLink>}
          {isAuthenticated && (user.role === 'owner' || user.role === 'admin') && (
            <NavLink to="/dashboard">Dashboard</NavLink>
          )}
          <NavLink to="/status">System</NavLink>
        </nav>

        <div className="nav-actions">
          <Link to="/cart" className="cart-button" data-testid="cart-button">
            🛒 Cart
            {itemCount > 0 && <span className="badge">{itemCount}</span>}
          </Link>

          {isAuthenticated ? (
            <div className="user-chip">
              <span className="user-name">{user.full_name}</span>
              <span className={`role-tag role-${user.role}`}>{user.role}</span>
              <button type="button" className="btn btn-ghost" onClick={handleLogout}>
                Log out
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Log in</Link>
              <Link to="/register" className="btn btn-primary">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
