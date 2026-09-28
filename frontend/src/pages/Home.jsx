import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/products')
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => ['All', ...new Set(products.map((p) => p.category || 'General'))],
    [products]
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = products.filter(
      (p) =>
        (category === 'All' || p.category === category) &&
        p.name.toLowerCase().includes(term)
    );
    if (sort === 'price-asc') return [...list].sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === 'price-desc') return [...list].sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === 'name') return [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, search, category, sort]);

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">Welcome to CodeAlpha Store</span>
          <h1>Discover products you will love</h1>
          <p>Quality products, secure checkout and a smooth shopping experience from start to finish.</p>
          <a href="#catalog" className="btn btn-light">Shop now</a>
        </div>
      </section>

      <div id="catalog" className="toolbar">
        <div className="search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="input"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="name">Name: A to Z</option>
        </select>
      </div>

      <div className="chips" style={{ marginBottom: 24 }}>
        {categories.map((c) => (
          <button
            key={c}
            className={`chip ${category === c ? 'active' : ''}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {error && <div className="alert error">{error}</div>}

      {loading ? (
        <div className="grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card skeleton">
              <div className="card-media" />
              <div className="card-body">
                <div className="line short" />
                <div className="line" />
              </div>
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="empty-state">
          <h2>No products found</h2>
          <p>Try a different search term or category.</p>
        </div>
      ) : (
        <div className="grid">
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </>
  );
}