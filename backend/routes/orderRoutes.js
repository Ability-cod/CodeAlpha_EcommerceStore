const express = require('express');
const router = express.Router();
const {
  checkout,
  myOrders,
  orderDetails,
  allOrders,
  changeStatus
} = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/checkout', protect, checkout);
router.get('/my-orders', protect, myOrders);
router.get('/all', protect, adminOnly, allOrders);
router.put('/:id/status', protect, adminOnly, changeStatus);
router.get('/:id/items', protect, orderDetails);

module.exports = router;