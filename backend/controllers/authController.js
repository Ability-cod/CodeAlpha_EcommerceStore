const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findUserByEmail, createUser } = require('../models/userModel');

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

const register = async (req, res) => {
  try {
    const { name, password } = req.body;
    const email = (req.body.email || '').trim().toLowerCase();

    if (!name || !name.trim() || !email || !password) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await createUser(name.trim(), email, hashedPassword);

    const user = { id: userId, name: name.trim(), email, role: 'customer' };
    res.status(201).json({ message: 'Account created successfully', token: signToken(user), user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong on the server' });
  }
};

const login = async (req, res) => {
  try {
    const { password } = req.body;
    const email = (req.body.email || '').trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter your email and password' });
    }

    const found = await findUserByEmail(email);
    if (!found || !(await bcrypt.compare(password, found.password))) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const user = { id: found.id, name: found.name, email: found.email, role: found.role };
    res.json({ message: 'Logged in successfully', token: signToken(user), user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong on the server' });
  }
};

module.exports = { register, login };