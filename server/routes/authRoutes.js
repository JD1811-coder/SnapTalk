// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { loginUser, logoutUser, getMe, registerUser } = require('../controller/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser); 
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);

module.exports = router;
