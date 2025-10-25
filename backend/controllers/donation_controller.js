const Donation = require('../models/donation_model');

// Create a new donation
const createDonation = async (req, res) => {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Please provide a valid amount' });
    }

    try {
        const donation = new Donation({
            user: req.user, // req.user is the ID from 'protect' middleware
            amount: amount
        });

        const createdDonation = await donation.save();
        res.status(201).json(createdDonation);

    } catch (error) {
        res.status(500).json({ message: 'Server error creating donation' });
    }
};

// Get all donations for the logged-in user
const getUserDonations = async (req, res) => {
    try {
        const donations = await Donation.find({ user: req.user });
        res.status(200).json(donations);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching donations' });
    }
};

module.exports = {
    createDonation,
    getUserDonations
};
