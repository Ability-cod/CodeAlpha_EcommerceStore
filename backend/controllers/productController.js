const fs = require('fs');
const path = require('path');
const { uploadDir } = require('../middleware/upload');
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../models/productModel');

const removeImageFile = (imageUrl) => {
  if (!imageUrl || !imageUrl.startsWith('/uploads/')) return;
  fs.unlink(path.join(uploadDir, path.basename(imageUrl)), () => {});
};

const parseFields = (body) => ({
  name: (body.name || '').trim(),
  description: (body.description || '').trim(),
  category: (body.category || '').trim() || 'General',
  price: Number(body.price),
  stock: Number.parseInt(body.stock || 0, 10)
});

const isValid = ({ name, price, stock }) =>
  name && !Number.isNaN(price) && price >= 0 && !Number.isNaN(stock) && stock >= 0;

const listProducts = async (req, res) => {
  try {
    res.json(await getAllProducts());
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong on the server' });
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong on the server' });
  }
};

const addProduct = async (req, res) => {
  const newImage = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const fields = parseFields(req.body);
    if (!isValid(fields)) {
      removeImageFile(newImage);
      return res.status(400).json({ message: 'A valid name, price and stock are required' });
    }

    const id = await createProduct(
      fields.name, fields.description, fields.category, fields.price, newImage, fields.stock
    );
    res.status(201).json({ message: 'Product added', id });
  } catch (error) {
    removeImageFile(newImage);
    console.error(error);
    res.status(500).json({ message: 'Something went wrong on the server' });
  }
};

const editProduct = async (req, res) => {
  const newImage = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const existing = await getProductById(req.params.id);
    if (!existing) {
      removeImageFile(newImage);
      return res.status(404).json({ message: 'Product not found' });
    }

    const fields = parseFields(req.body);
    if (!isValid(fields)) {
      removeImageFile(newImage);
      return res.status(400).json({ message: 'A valid name, price and stock are required' });
    }

    await updateProduct(
      req.params.id, fields.name, fields.description, fields.category,
      fields.price, newImage || existing.image_url, fields.stock
    );

    if (newImage) removeImageFile(existing.image_url);
    res.json({ message: 'Product updated' });
  } catch (error) {
    removeImageFile(newImage);
    console.error(error);
    res.status(500).json({ message: 'Something went wrong on the server' });
  }
};

const removeProduct = async (req, res) => {
  try {
    const existing = await getProductById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Product not found' });

    await deleteProduct(req.params.id);
    removeImageFile(existing.image_url);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        message: 'This product is part of existing orders and cannot be deleted'
      });
    }
    console.error(error);
    res.status(500).json({ message: 'Something went wrong on the server' });
  }
};

module.exports = { listProducts, getProduct, addProduct, editProduct, removeProduct };