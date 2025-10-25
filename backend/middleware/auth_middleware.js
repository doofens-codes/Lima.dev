const jwt = require('jsonwebtoken');

// Middleware to protect routes
const protect = (req, res, next) => {
    let token;

    // 1. Get token from httpOnly cookie
    if (req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }

    // 2. Check if token exists
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        // 3. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Attach user ID to the request object for use in controllers
        // We only attach the ID. The controller can fetch user data if needed.
        req.user = decoded.id;

        next();
    } catch (error) {
        // Handle token expiration or invalidity
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Not authorized, token expired' });
        }
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

module.exports = { protect };
