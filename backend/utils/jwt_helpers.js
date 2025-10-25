const jwt = require('jsonwebtoken');

// Generate an Access Token
// Short-lived (e.g., 15 minutes)
const generateAccessToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
};

// Generate a Refresh Token
// Long-lived (e.g., 7 days)
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );
};

module.exports = {
    generateAccessToken,
    generateRefreshToken
};
