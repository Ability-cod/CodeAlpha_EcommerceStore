import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, imageSrc } from '../api';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { notify } = useToast();
  const src = imageSrc(product.image_url);
  const outOfStock = product.stock <= 0;

  const handleAdd = () => {
    addToCart(product);
    notify(`${product.name} added to cart`);
  };

  return (
    <article className="card">
      <Link to={`/product/${product.id}`} className="card-media">
        {src ? (
          <img src={src} alt={product.name} loading="lazy" />
        ) : (
          <div className="img-placeholder">{product.name.charAt(0).toUpperCase()}</div>
        )}
        {outOfStock && <span className="tag tag-out">Sold out</span>}
        {!outOfStock && product.stock <= 5 && (
          <span className="tag tag-low">Only {product.stock} left</span>
        )}
      </Link>

      <div className="card-body">
        <span className="card-category">{product.category}</span>
        <Link to={`/product/${product.id}`} className="card-title">
          {product.name}
        </Link>
        <div className="card-footer">
          <span className="price">{formatPrice(product.price)}</span>
          <button className="btn btn-sm" disabled={outOfStock} onClick={handleAdd}>
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}