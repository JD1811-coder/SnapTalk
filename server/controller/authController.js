// controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../model/user');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = generateToken(user._id);

  res.cookie('token', token, {
    httpOnly: true,
    secure: false, // true in production with HTTPS
    sameSite: 'Lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  res.status(200).json({
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
    },
  });
};

exports.logoutUser = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
};

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.status(200).json({ user });
};

exports.registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: 'Email already in use' });
  }

  const user = await User.create({ username, email, password });

  const token = generateToken(user._id);

  res.cookie('token', token, {
    httpOnly: true,
    secure: false, // true in production
    sameSite: 'Lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
    },
  });
};
