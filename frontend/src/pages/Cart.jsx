import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, formatPrice, imageSrc } from '../api';
import QuantityStepper from '../components/QuantityStepper';

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
  const { user, token } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/cart' } } });
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api('/orders/checkout', {
        method: 'POST',
        token,
        body: {
          items: cartItems.map((item) => ({ productId: item.id, quantity: item.quantity }))
        }
      });
      clearCart();
      notify('Order placed successfully!');
      navigate('/orders');
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
        <p>Looks like you have not added anything yet.</p>
        <Link to="/" className="btn">Start shopping</Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="page-title">Shopping cart</h1>

      <div className="cart-layout">
        <div className="cart-list">
          {cartItems.map((item) => {
            const src = imageSrc(item.image_url);
            return (
              <div key={item.id} className="cart-row">
                <div className="cart-thumb">
                  {src ? (
                    <img src={src} alt={item.name} />
                  ) : (
                    <div className="img-placeholder">{item.name.charAt(0).toUpperCase()}</div>
                  )}
                </div>

                <div className="cart-info">
                  <h3>{item.name}</h3>
                  <p>{formatPrice(item.price)} each</p>
                  <button className="btn btn-danger btn-sm" style={{ marginTop: 8 }} onClick={() => removeFromCart(item.id)}>
                    Remove
                  </button>
                </div>

                <QuantityStepper
                  value={item.quantity}
                  max={item.stock}
                  onChange={(q) => updateQuantity(item.id, q)}
                />

                <div className="cart-line-total">{formatPrice(item.price * item.quantity)}</div>
              </div>
            );
          })}
        </div>

        <aside className="summary">
          <h2>Order summary</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(cartTotal)}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>{formatPrice(cartTotal)}</span>
          </div>
          {error && <div className="alert error">{error}</div>}
          <button className="btn btn-block" onClick={handleCheckout} disabled={loading}>
            {loading ? 'Placing order...' : user ? 'Place order' : 'Log in to checkout'}
          </button>
          <Link to="/" className="btn btn-ghost btn-block">Continue shopping</Link>
        </aside>
      </div>
    </>
  );
}