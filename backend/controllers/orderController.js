const pool = require('../config/db');
const {
  getOrdersByUser,
  getOrderItems,
  getAllOrders,
  updateOrderStatus
} = require('../models/orderModel');

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const checkout = async (req, res) => {
  const { items } = req.body;
  const userId = req.user.id;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Your cart is empty' });
  }

  // Validate input and merge duplicate products
  const merged = new Map();
  for (const item of items) {
    const productId = Number(item.productId);
    const quantity = Number(item.quantity);
    if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ message: 'Invalid cart data' });
    }
    merged.set(productId, (merged.get(productId) || 0) + quantity);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let totalAmount = 0;
    const lines = [];

    for (const [productId, quantity] of merged) {
      // FOR UPDATE locks the row so two buyers cannot take the same last item
      const [rows] = await connection.query(
        'SELECT id, name, price, stock FROM products WHERE id = ? FOR UPDATE',
        [productId]
      );
      const product = rows[0];

      if (!product) {
        await connection.rollback();
        return res.status(404).json({ message: `Product #${productId} no longer exists` });
      }
      if (product.stock < quantity) {
        await connection.rollback();
        return res.status(400).json({
          message: `Not enough stock for "${product.name}" (only ${product.stock} left)`
        });
      }

      totalAmount += Number(product.price) * quantity;
      lines.push({ productId, quantity, price: product.price });
    }

    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
      [userId, totalAmount.toFixed(2), 'pending']
    );
    const orderId = orderResult.insertId;

    for (const line of lines) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, line.productId, line.quantity, line.price]
      );
      await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [
        line.quantity,
        line.productId
      ]);
    }

    await connection.commit();
    res.status(201).json({ message: 'Order placed successfully', orderId, totalAmount });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Something went wrong on the server' });
  } finally {
    connection.release();
  }
};

const myOrders = async (req, res) => {
  try {
    res.json(await getOrdersByUser(req.user.id));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong on the server' });
  }
};

const orderDetails = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      const [orders] = await pool.query('SELECT id FROM orders WHERE id = ? AND user_id = ?', [
        req.params.id,
        req.user.id
      ]);
      if (orders.length === 0) {
        return res.status(404).json({ message: 'Order not found' });
      }
    }
    res.json(await getOrderItems(req.params.id));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong on the server' });
  }
};

const allOrders = async (req, res) => {
  try {
    res.json(await getAllOrders());
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong on the server' });
  }
};

const changeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }
    const affected = await updateOrderStatus(req.params.id, status);
    if (!affected) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order status updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong on the server' });
  }
};

module.exports = { checkout, myOrders, orderDetails, allOrders, changeStatus };