const User = require('../models/user_model');

// Get User Profile
// This is used to get user data for the navbar, etc.
const getUserProfile = async (req, res) => {
    try {
        // req.user is the ID attached by the 'protect' middleware
        const user = await User.findById(req.user).select('-password');

        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error getting profile' });
    }
};

module.exports = {
    getUserProfile
};
