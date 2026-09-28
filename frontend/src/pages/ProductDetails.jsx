import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api, formatPrice, imageSrc } from '../api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import QuantityStepper from '../components/QuantityStepper';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { notify } = useToast();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/products/${id}`)
      .then(setProduct)
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return (
      <div className="empty-state">
        <h2>{error}</h2>
        <Link to="/" className="btn">Back to shop</Link>
      </div>
    );
  }
  if (!product) return <p>Loading...</p>;

  const src = imageSrc(product.image_url);
  const outOfStock = product.stock <= 0;

  const handleAdd = () => {
    addToCart(product, quantity);
    notify(`${product.name} added to cart`);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate('/cart');
  };

  return (
    <>
      <Link to="/" className="back-link">← Back to shop</Link>

      <div className="details">
        <div className="details-media">
          {src ? (
            <img src={src} alt={product.name} />
          ) : (
            <div className="img-placeholder" style={{ fontSize: '6rem' }}>
              {product.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="details-info">
          <span className="card-category">{product.category}</span>
          <h1>{product.name}</h1>
          <p className="price big">{formatPrice(product.price)}</p>
          <p className="desc">{product.description || 'No description available.'}</p>

          <p className={`stock-note ${outOfStock ? 'out' : 'ok'}`}>
            {outOfStock ? 'Currently out of stock' : `In stock (${product.stock} available)`}
          </p>

          {!outOfStock && (
            <div className="actions">
              <QuantityStepper value={quantity} max={product.stock} onChange={setQuantity} />
              <button className="btn" onClick={handleAdd}>Add to cart</button>
              <button className="btn btn-ghost" onClick={handleBuyNow}>Buy now</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}