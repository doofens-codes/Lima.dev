const express = require('express');
const { createDonation, getUserDonations } = require('../controllers/donation_controller');
const { protect } = require('../middleware/auth_middleware');

const router = express.Router();

// All donation routes are protected
router.use(protect);

// @route   POST /api/donations
// @desc    Create a new donation record
router.post('/', createDonation);

// @route   GET /api/donations
// @desc    Get all donations for the logged-in user
router.get('/', getUserDonations);

module.exports = router;
