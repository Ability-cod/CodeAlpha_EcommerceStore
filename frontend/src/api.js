export const API_ORIGIN = 'http://localhost:5000';
const API_URL = `${API_ORIGIN}/api`;

export const api = async (path, { method = 'GET', body, token } = {}) => {
  const isForm = body instanceof FormData;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong. Please try again.');
  return data;
};

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const formatPrice = (value) => currency.format(Number(value));

export const imageSrc = (path) => {
  if (!path) return null;
  return path.startsWith('http') ? path : `${API_ORIGIN}${path}`;
};