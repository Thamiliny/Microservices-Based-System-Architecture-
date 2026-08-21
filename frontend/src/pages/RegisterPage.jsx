import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert } from '../components/Common.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '', email: '', password: '', phone: '', address: '', role: 'customer'
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register({
        ...form,
        phone: form.phone || undefined,
        address: form.address || undefined
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container narrow">
      <section className="panel">
        <h1>Create your account</h1>
        <form onSubmit={submit} className="form">
          <Alert type="error">{error}</Alert>

          <label>
            Full name
            <input required minLength={3} value={form.fullName} onChange={update('fullName')}
                   data-testid="register-name" />
          </label>
          <label>
            Email
            <input type="email" required value={form.email} onChange={update('email')}
                   data-testid="register-email" />
          </label>
          <label>
            Password
            <input type="password" required minLength={8} value={form.password}
                   onChange={update('password')} data-testid="register-password" />
            <small className="muted">At least 8 characters.</small>
          </label>
          <label>
            Phone
            <input value={form.phone} onChange={update('phone')} placeholder="Optional" />
          </label>
          <label>
            Delivery address
            <textarea rows={2} value={form.address} onChange={update('address')} placeholder="Optional" />
          </label>
          <label>
            Account type
            <select value={form.role} onChange={update('role')}>
              <option value="customer">Customer</option>
              <option value="owner">Restaurant owner</option>
            </select>
          </label>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}
                  data-testid="register-submit">
            {submitting ? 'Creating account…' : 'Sign up'}
          </button>
        </form>
        <p className="muted">Already registered? <Link to="/login">Log in</Link>.</p>
      </section>
    </div>
  );
}
