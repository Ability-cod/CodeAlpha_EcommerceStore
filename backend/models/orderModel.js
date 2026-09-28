const pool = require('../config/db');

const getOrdersByUser = async (userId) => {
  const [rows] = await pool.query(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  return rows;
};

const getOrderItems = async (orderId) => {
  const [rows] = await pool.query(
    `SELECT oi.*, p.name, p.image_url
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ?`,
    [orderId]
  );
  return rows;
};

const getAllOrders = async () => {
  const [rows] = await pool.query(
    `SELECT o.*, u.name AS customer_name, u.email AS customer_email,
            (SELECT COALESCE(SUM(quantity), 0) FROM order_items WHERE order_id = o.id) AS item_count
     FROM orders o
     JOIN users u ON o.user_id = u.id
     ORDER BY o.created_at DESC`
  );
  return rows;
};

const updateOrderStatus = async (id, status) => {
  const [result] = await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
  return result.affectedRows;
};

module.exports = { getOrdersByUser, getOrderItems, getAllOrders, updateOrderStatus };