import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatPrice, imageSrc } from '../api';
import QuantityStepper from '../components/QuantityStepper';

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();

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
          <p style={{ color: 'var(--muted)', fontSize: '.875rem' }}>
            Delivery details and payment method come next.
          </p>
          <Link to="/checkout" className="btn btn-block">Proceed to checkout</Link>
          <Link to="/" className="btn btn-ghost btn-block">Continue shopping</Link>
        </aside>
      </div>
    </>
  );
}