import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/';

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api('/auth/login', { method: 'POST', body: form });
      login(data.user, data.token);
      notify(`Welcome back, ${data.user.name.split(' ')[0]}!`);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-card" onSubmit={handleSubmit}>
      <h1>Welcome back</h1>
      <p className="sub">Log in to your account to continue.</p>
      {error && <div className="alert error">{error}</div>}

      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" className="input" type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" className="input" type="password" name="password" placeholder="Your password" value={form.password} onChange={handleChange} required />
      </div>

      <button className="btn btn-block" disabled={loading}>
        {loading ? 'Logging in...' : 'Log in'}
      </button>
      <p className="switch">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </form>
  );
}