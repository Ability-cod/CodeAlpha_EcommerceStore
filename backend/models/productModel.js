const pool = require('../config/db');

const getAllProducts = async () => {
  const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
  return rows;
};

const getProductById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
  return rows[0];
};

const createProduct = async (name, description, category, price, image_url, stock) => {
  const [result] = await pool.query(
    'INSERT INTO products (name, description, category, price, image_url, stock) VALUES (?, ?, ?, ?, ?, ?)',
    [name, description, category, price, image_url, stock]
  );
  return result.insertId;
};

const updateProduct = async (id, name, description, category, price, image_url, stock) => {
  await pool.query(
    'UPDATE products SET name=?, description=?, category=?, price=?, image_url=?, stock=? WHERE id=?',
    [name, description, category, price, image_url, stock, id]
  );
};

const deleteProduct = async (id) => {
  await pool.query('DELETE FROM products WHERE id = ?', [id]);
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };