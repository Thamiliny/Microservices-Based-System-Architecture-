import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/** Redirects unauthenticated visitors to the login page. */
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="container"><p className="muted">Loading session…</p></div>;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="container">
        <div className="alert alert-error">
          Your role (<strong>{user.role}</strong>) does not have access to this page.
        </div>
      </div>
    );
  }
  return children;
}
