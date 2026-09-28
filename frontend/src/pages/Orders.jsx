import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatPrice, imageSrc, paymentLabel } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Orders() {
  const { token } = useAuth();
  const { notify } = useToast();
  const [orders, setOrders] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/orders/my-orders', { token })
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const toggleOrder = async (orderId) => {
    if (openId === orderId) {
      setOpenId(null);
      return;
    }
    setOpenId(orderId);
    if (!items[orderId]) {
      try {
        const data = await api(`/orders/${orderId}/items`, { token });
        setItems((prev) => ({ ...prev, [orderId]: data }));
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleCancel = async (order) => {
    if (!window.confirm(`Cancel order #${order.id}? This cannot be undone.`)) return;
    try {
      await api(`/orders/${order.id}/cancel`, { method: 'PUT', token });
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: 'cancelled' } : o)));
      notify(`Order #${order.id} cancelled`);
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <h1 className="page-title">My orders</h1>
      {error && <div className="alert error" style={{ marginBottom: 16 }}>{error}</div>}

      {orders.length === 0 ? (
        <div className="empty-state">
          <h2>No orders yet</h2>
          <p>When you place an order, it will show up here.</p>
          <Link to="/" className="btn">Start shopping</Link>
        </div>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="order-card">
            <button className="order-head" onClick={() => toggleOrder(order.id)}>
              <span className="order-id">Order #{order.id}</span>
              <span className="order-date">
                {new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
              <span className={`badge ${order.status}`}>{order.status}</span>
              <strong>{formatPrice(order.total_amount)}</strong>
            </button>

            {openId === order.id && (
              <div className="order-items">
                {(items[order.id] || []).map((item) => {
                  const src = imageSrc(item.image_url);
                  return (
                    <div key={item.id} className="order-item">
                      <div className="cart-thumb">
                        {src ? (
                          <img src={src} alt={item.name} />
                        ) : (
                          <div className="img-placeholder">{item.name.charAt(0).toUpperCase()}</div>
                        )}
                      </div>
                      <div className="grow">
                        <strong>{item.name}</strong>
                        <div style={{ color: 'var(--muted)', fontSize: '.9rem' }}>
                          {item.quantity} × {formatPrice(item.price)}
                        </div>
                      </div>
                      <strong>{formatPrice(item.price * item.quantity)}</strong>
                    </div>
                  );
                })}

                <div className="order-meta">
                  <div>
                    <h4>Delivery</h4>
                    {order.shipping_name ? (
                      <>
                        <p>
                          {order.shipping_name}
                          <br />
                          {order.shipping_address}
                          <br />
                          {order.shipping_city}, {order.shipping_country}
                          <br />
                          {order.shipping_phone}
                        </p>
                        {order.shipping_notes && (
                          <p style={{ color: 'var(--muted)', marginTop: 6 }}>Note: {order.shipping_notes}</p>
                        )}
                      </>
                    ) : (
                      <p style={{ color: 'var(--muted)' }}>No delivery details recorded.</p>
                    )}
                  </div>
                  <div>
                    <h4>Payment</h4>
                    <p style={{ marginBottom: 6 }}>{paymentLabel(order.payment_method)}</p>
                    <span className={`badge ${order.payment_status}`}>{order.payment_status}</span>
                  </div>
                </div>

                {order.status === 'pending' && order.payment_status !== 'paid' && (
                  <div className="order-actions">
                    <button className="btn btn-danger btn-sm" onClick={() => handleCancel(order)}>
                      Cancel order
                    </button>
                    <span>You can cancel while the order is still pending.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </>
  );
}