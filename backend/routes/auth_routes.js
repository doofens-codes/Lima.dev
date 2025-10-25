const express = require('express');
const { signup, login, logout, refreshToken, checkAuth } = require('../controllers/auth_controller');
const { protect } = require('../middleware/auth_middleware');

const router = express.Router();

// @route   POST /api/auth/signup
// @desc    Register a new user
router.post('/signup', signup);

// @route   POST /api/auth/login
// @desc    Authenticate user and get tokens
router.post('/login', login);

// @route   POST /api/auth/logout
// @desc    Log user out (clear cookies)
router.post('/logout', logout);

// @route   POST /api/auth/refresh-token
// @desc    Get a new access token using a refresh token
router.post('/refresh-token', refreshToken);

// @route   GET /api/auth/check
// @desc    Check if user is logged in (used for UI updates on page load)
router.get('/check', protect, checkAuth);


module.exports = router;
