const express = require('express');
const { getUserProfile } = require('../controllers/user_controller');
const { protect } = require('../middleware/auth_middleware');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get the logged-in user's profile data (for navbar, etc.)
// We protect this route with our 'protect' middleware
router.get('/profile', protect, getUserProfile);

module.exports = router;
