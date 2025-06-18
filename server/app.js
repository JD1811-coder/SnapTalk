require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const createError = require('http-errors');
const mongoose = require('mongoose');

const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001',"http://localhost:3002"],
  credentials: true,
}));

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/SnapTalk")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Middleware and routes setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', require('./routes/index'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/conversation', require('./routes/conversationRoutes'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ message: 'SnapTalk API is alive 🚀' });
});

// 404 and error handlers
app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app; 
