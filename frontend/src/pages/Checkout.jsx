import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, formatPrice, imageSrc } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Checkout() {
  const { user, token } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: '',
    country: '',
    city: '',
    address: '',
    notes: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api('/orders/checkout', {
        method: 'POST',
        token,
        body: {
          items: cartItems.map((item) => ({ productId: item.id, quantity: item.quantity })),
          shipping: form,
          paymentMethod
        }
      });
      navigate('/order-success', {
        replace: true,
        state: { orderId: data.orderId, total: data.totalAmount, paymentMethod }
      });
      clearCart();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="empty-state">
        <h2>Your cart is empty</h2>
        <p>Add some products before checking out.</p>
        <Link to="/" className="btn">Start shopping</Link>
      </div>
    );
  }

  return (
    <>
      <Link to="/cart" className="back-link">← Back to cart</Link>
      <h1 className="page-title">Checkout</h1>

      <div className="cart-layout">
        <form id="checkout-form" className="checkout-main" onSubmit={handleSubmit}>
          <section className="panel form-stack">
            <h2>Delivery details</h2>

            <div className="form-row">
              <div className="field">
                <label htmlFor="c-name">Full name</label>
                <input id="c-name" className="input" name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="field">
                <label htmlFor="c-phone">Phone number</label>
                <input id="c-phone" className="input" name="phone" placeholder="+255 700 000 000" value={form.phone} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="c-country">Country</label>
                <input id="c-country" className="input" name="country" placeholder="e.g. Tanzania" value={form.country} onChange={handleChange} required />
              </div>
              <div className="field">
                <label htmlFor="c-city">City</label>
                <input id="c-city" className="input" name="city" placeholder="e.g. Dar es Salaam" value={form.city} onChange={handleChange} required />
              </div>
            </div>

            <div className="field">
              <label htmlFor="c-address">Street address</label>
              <input id="c-address" className="input" name="address" placeholder="Street, area, building or house number" value={form.address} onChange={handleChange} required />
            </div>

            <div className="field">
              <label htmlFor="c-notes">Delivery notes (optional)</label>
              <textarea id="c-notes" className="input" name="notes" placeholder="e.g. Near the bus stop, call when you arrive" value={form.notes} onChange={handleChange} />
            </div>
          </section>

          <section className="panel form-stack">
            <h2>Payment method</h2>

            <label className={`pay-option ${paymentMethod === 'cod' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="payment"
                value="cod"
                checked={paymentMethod === 'cod'}
                onChange={() => setPaymentMethod('cod')}
              />
              <div>
                <strong>Cash on delivery</strong>
                <span>Pay in cash when your order arrives.</span>
              </div>
            </label>

            <label className="pay-option disabled">
              <input type="radio" name="payment" value="card" disabled />
              <div>
                <strong>Credit / debit card</strong>
                <span>Secure online card payment.</span>
              </div>
              <span className="badge">Coming soon</span>
            </label>
          </section>
        </form>

        <aside className="summary">
          <h2>Order summary</h2>

          <div className="summary-items">
            {cartItems.map((item) => {
              const src = imageSrc(item.image_url);
              return (
                <div key={item.id} className="mini-item">
                  <div className="cart-thumb">
                    {src ? (
                      <img src={src} alt={item.name} />
                    ) : (
                      <div className="img-placeholder">{item.name.charAt(0).toUpperCase()}</div>
                    )}
                  </div>
                  <div className="grow">
                    <strong>{item.name}</strong>
                    <div style={{ color: 'var(--muted)' }}>Qty {item.quantity}</div>
                  </div>
                  <strong>{formatPrice(item.price * item.quantity)}</strong>
                </div>
              );
            })}
          </div>

          <div className="summary-row total">
            <span>Total</span>
            <span>{formatPrice(cartTotal)}</span>
          </div>

          {error && <div className="alert error">{error}</div>}

          <button className="btn btn-block" type="submit" form="checkout-form" disabled={loading}>
            {loading ? 'Placing order...' : 'Place order'}
          </button>
        </aside>
      </div>
    </>
  );
}