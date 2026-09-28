import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          <span className="brand-mark">C</span>
          <span>
            CodeAlpha <span className="brand-light">Store</span>
          </span>
        </Link>

        <nav className="nav-links">
          <NavLink to="/" end>Shop</NavLink>
          {user && <NavLink to="/orders">My Orders</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin">Dashboard</NavLink>}
        </nav>

        <div className="nav-actions">
          <Link to="/cart" className="cart-link" aria-label="Shopping cart">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
            </svg>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>

          {user ? (
            <>
              <span className="user-chip">{user.name.split(' ')[0]}</span>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
              <Link to="/register" className="btn btn-sm">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}