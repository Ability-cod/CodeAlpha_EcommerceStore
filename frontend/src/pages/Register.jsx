import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const data = await api('/auth/register', { method: 'POST', body: form });
      login(data.user, data.token);
      notify('Account created successfully!');
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-card" onSubmit={handleSubmit}>
      <h1>Create your account</h1>
      <p className="sub">Join CodeAlpha Store and start shopping.</p>
      {error && <div className="alert error">{error}</div>}

      <div className="field">
        <label htmlFor="name">Full name</label>
        <input id="name" className="input" name="name" placeholder="Jane Doe" value={form.name} onChange={handleChange} required />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" className="input" type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" className="input" type="password" name="password" placeholder="At least 6 characters" value={form.password} onChange={handleChange} required />
      </div>

      <button className="btn btn-block" disabled={loading}>
        {loading ? 'Creating account...' : 'Create account'}
      </button>
      <p className="switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </form>
  );
}