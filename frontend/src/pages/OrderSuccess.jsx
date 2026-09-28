import { Link, Navigate, useLocation } from 'react-router-dom';
import { formatPrice, paymentLabel } from '../api';

export default function OrderSuccess() {
  const { state } = useLocation();

  if (!state?.orderId) return <Navigate to="/orders" replace />;

  return (
    <div className="success-card">
      <div className="success-icon">✓</div>
      <h1>Thank you for your order!</h1>
      <p>
        Your order <strong>#{state.orderId}</strong> has been placed successfully.
      </p>
      <p>
        Total: <strong>{formatPrice(state.total)}</strong> · {paymentLabel(state.paymentMethod)}
      </p>
      {state.paymentMethod === 'cod' && (
        <p style={{ color: 'var(--muted)' }}>
          Please have {formatPrice(state.total)} ready when your order arrives.
        </p>
      )}
      <div className="actions" style={{ justifyContent: 'center' }}>
        <Link to="/orders" className="btn">View my orders</Link>
        <Link to="/" className="btn btn-ghost">Continue shopping</Link>
      </div>
    </div>
  );
}