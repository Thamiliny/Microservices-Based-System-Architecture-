import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert } from '../components/Common.jsx';

const DEMO_ACCOUNTS = [
  { label: 'Customer', email: 'customer@example.com', password: 'Customer@123' },
  { label: 'Restaurant owner', email: 'owner.spice@example.com', password: 'Owner@123' },
  { label: 'Administrator', email: 'admin@fooddelivery.lk', password: 'Admin@123' }
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container narrow">
      <section className="panel">
        <h1>Log in</h1>
        <form onSubmit={submit} className="form">
          <Alert type="error">{error}</Alert>
          <label>
            Email
            <input type="email" required value={email} data-testid="login-email"
                   onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          </label>
          <label>
            Password
            <input type="password" required value={password} data-testid="login-password"
                   onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </label>
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}
                  data-testid="login-submit">
            {submitting ? 'Signing in…' : 'Log in'}
          </button>
        </form>
        <p className="muted">No account yet? <Link to="/register">Create one</Link>.</p>
      </section>

      <section className="panel">
        <h2>Demo accounts</h2>
        <p className="muted">Seeded by the database container on first start.</p>
        <ul className="demo-list">
          {DEMO_ACCOUNTS.map((a) => (
            <li key={a.email}>
              <div>
                <strong>{a.label}</strong>
                <code>{a.email}</code> / <code>{a.password}</code>
              </div>
              <button type="button" className="btn btn-ghost"
                      onClick={() => { setEmail(a.email); setPassword(a.password); }}>
                Use
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
