const express = require('express');
const router = express.Router();
const {
  listProducts,
  getProduct,
  addProduct,
  editProduct,
  removeProduct
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/upload');

router.get('/', listProducts);
router.get('/:id', getProduct);

router.post('/', protect, adminOnly, upload.single('image'), addProduct);
router.put('/:id', protect, adminOnly, upload.single('image'), editProduct);
router.delete('/:id', protect, adminOnly, removeProduct);

module.exports = router;