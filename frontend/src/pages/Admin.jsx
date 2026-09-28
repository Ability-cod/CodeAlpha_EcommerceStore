import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, formatPrice, imageSrc } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const emptyForm = { name: '', category: '', description: '', price: '', stock: '' };
const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function ProductManager({ products, reload }) {
  const { token } = useAuth();
  const { notify } = useToast();
  const fileRef = useRef(null);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Free the temporary preview URL when it changes or the page closes
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))],
    [products]
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setImageFile(null);
    setPreview(null);
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError('Image must be smaller than 5MB');
      e.target.value = '';
      return;
    }
    setError('');
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const body = new FormData();
    body.append('name', form.name);
    body.append('category', form.category || 'General');
    body.append('description', form.description);
    body.append('price', form.price);
    body.append('stock', form.stock || 0);
    if (imageFile) body.append('image', imageFile);

    try {
      if (editingId) {
        await api(`/products/${editingId}`, { method: 'PUT', token, body });
        notify('Product updated');
      } else {
        await api('/products', { method: 'POST', token, body });
        notify('Product added');
      }
      resetForm();
      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category || '',
      description: product.description || '',
      price: product.price,
      stock: product.stock
    });
    setImageFile(null);
    setPreview(imageSrc(product.image_url));
    setError('');
    if (fileRef.current) fileRef.current.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    try {
      await api(`/products/${product.id}`, { method: 'DELETE', token });
      notify('Product deleted');
      if (editingId === product.id) resetForm();
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <div className="admin-layout">
      <form className="panel form-stack" onSubmit={handleSubmit}>
        <h2>{editingId ? 'Edit product' : 'Add new product'}</h2>
        {error && <div className="alert error">{error}</div>}

        <div className="field">
          <label>Product image</label>
          <label className="upload">
            {preview ? (
              <img src={preview} alt="Preview" className="upload-preview" />
            ) : (
              <>
                <strong>Click to upload an image</strong>
                <span>JPG, PNG, WEBP or GIF · max 5MB</span>
              </>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} />
          </label>
          {preview && <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>Click the image to replace it</span>}
        </div>

        <div className="field">
          <label htmlFor="p-name">Name</label>
          <input id="p-name" className="input" name="name" value={form.name} onChange={handleChange} required />
        </div>

        <div className="field">
          <label htmlFor="p-category">Category</label>
          <input id="p-category" className="input" name="category" list="category-list" placeholder="e.g. Electronics" value={form.category} onChange={handleChange} />
          <datalist id="category-list">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="p-price">Price (USD)</label>
            <input id="p-price" className="input" type="number" step="0.01" min="0" name="price" value={form.price} onChange={handleChange} required />
          </div>
          <div className="field">
            <label htmlFor="p-stock">Stock</label>
            <input id="p-stock" className="input" type="number" min="0" name="stock" value={form.stock} onChange={handleChange} required />
          </div>
        </div>

        <div className="field">
          <label htmlFor="p-desc">Description</label>
          <textarea id="p-desc" className="input" name="description" value={form.description} onChange={handleChange} />
        </div>

        <div className="row-actions">
          <button className="btn" disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update product' : 'Add product'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-ghost" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="panel">
        <h2>Products ({products.length})</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const src = imageSrc(p.image_url);
                return (
                  <tr key={p.id}>
                    <td>
                      {src ? (
                        <img className="thumb" src={src} alt={p.name} />
                      ) : (
                        <div className="thumb ph">{p.name.charAt(0).toUpperCase()}</div>
                      )}
                    </td>
                    <td><strong>{p.name}</strong></td>
                    <td>{p.category}</td>
                    <td>{formatPrice(p.price)}</td>
                    <td>{p.stock}</td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(p)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function OrderManager({ orders, reload }) {
  const { token } = useAuth();
  const { notify } = useToast();

  const changeStatus = async (id, status) => {
    try {
      await api(`/orders/${id}/status`, { method: 'PUT', token, body: { status } });
      notify(`Order #${id} marked as ${status}`);
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  if (orders.length === 0) {
    return (
      <div className="empty-state">
        <h2>No orders yet</h2>
        <p>Orders placed by customers will appear here.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2>All orders ({orders.length})</h2>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><strong>#{o.id}</strong></td>
                <td>
                  {o.customer_name}
                  <div style={{ color: 'var(--muted)', fontSize: '.85rem' }}>{o.customer_email}</div>
                </td>
                <td>{new Date(o.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                <td>{Number(o.item_count)}</td>
                <td>{formatPrice(o.total_amount)}</td>
                <td>
                  <select className="select" value={o.status} onChange={(e) => changeStatus(o.id, e.target.value)}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Admin() {
  const { token } = useAuth();
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  const loadProducts = useCallback(
    () => api('/products').then(setProducts).catch((err) => setError(err.message)),
    []
  );
  const loadOrders = useCallback(
    () => api('/orders/all', { token }).then(setOrders).catch((err) => setError(err.message)),
    [token]
  );

  useEffect(() => {
    loadProducts();
    loadOrders();
  }, [loadProducts, loadOrders]);

  const revenue = useMemo(
    () =>
      orders
        .filter((o) => o.status !== 'cancelled')
        .reduce((sum, o) => sum + Number(o.total_amount), 0),
    [orders]
  );
  const lowStock = products.filter((p) => p.stock <= 5).length;

  return (
    <>
      <h1 className="page-title">Admin dashboard</h1>
      {error && <div className="alert error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="stats">
        <div className="stat-card"><span>Products</span><strong>{products.length}</strong></div>
        <div className="stat-card"><span>Orders</span><strong>{orders.length}</strong></div>
        <div className="stat-card"><span>Revenue</span><strong>{formatPrice(revenue)}</strong></div>
        <div className="stat-card"><span>Low stock (5 or fewer)</span><strong>{lowStock}</strong></div>
      </div>

      <div className="tabs">
        <button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>Products</button>
        <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>Orders</button>
      </div>

      {tab === 'products' ? (
        <ProductManager products={products} reload={loadProducts} />
      ) : (
        <OrderManager orders={orders} reload={loadOrders} />
      )}
    </>
  );
}