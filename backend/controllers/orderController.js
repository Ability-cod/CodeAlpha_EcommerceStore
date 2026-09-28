const pool = require('../config/db');
const {
  getOrdersByUser,
  getOrderItems,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus
} = require('../models/orderModel');

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['unpaid', 'paid'];
const PAYMENT_METHODS = ['cod']; // card payments will be added later
const FIELD_LIMITS = { name: 100, country: 80, city: 80, address: 255, notes: 255 };

const validateShipping = (shipping = {}) => {
  const data = {
    name: String(shipping.name || '').trim(),
    phone: String(shipping.phone || '').trim(),
    country: String(shipping.country || '').trim(),
    city: String(shipping.city || '').trim(),
    address: String(shipping.address || '').trim(),
    notes: String(shipping.notes || '').trim()
  };

  if (data.name.length < 2) return { error: 'Please enter the recipient full name' };
  if (!/^\+?[\d\s()-]{7,20}$/.test(data.phone)) return { error: 'Please enter a valid phone number' };
  if (data.country.length < 2) return { error: 'Please enter the country' };
  if (data.city.length < 2) return { error: 'Please enter the city' };
  if (data.address.length < 5) return { error: 'Please enter the full delivery address' };

  for (const [key, max] of Object.entries(FIELD_LIMITS)) {
    if (data[key].length > max) return { error: 'Some delivery fields are too long' };
  }

  return { data };
};

const checkout = async (req, res) => {
  const { items } = req.body;
  const userId = req.user.id;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Your cart is empty' });
  }

  const { data: shipping, error: shippingError } = validateShipping(req.body.shipping);
  if (shippingError) return res.status(400).json({ message: shippingError });

  const paymentMethod = req.body.paymentMethod || 'cod';
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    return res.status(400).json({ message: 'This payment method is not available yet' });
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
      `INSERT INTO orders
        (user_id, total_amount, status, shipping_name, shipping_phone, shipping_country,
         shipping_city, shipping_address, shipping_notes, payment_method, payment_status)
       VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, 'unpaid')`,
      [
        userId,
        totalAmount.toFixed(2),
        shipping.name,
        shipping.phone,
        shipping.country,
        shipping.city,
        shipping.address,
        shipping.notes || null,
        paymentMethod
      ]
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

const changePayment = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    if (!PAYMENT_STATUSES.includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }
    const affected = await updatePaymentStatus(req.params.id, paymentStatus);
    if (!affected) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Payment status updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong on the server' });
  }
};

module.exports = { checkout, myOrders, orderDetails, allOrders, changeStatus, changePayment };