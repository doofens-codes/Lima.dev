const User = require('../models/user_model');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt_helpers');

// --- Helper Function to Send Tokens ---
// This sets the tokens in httpOnly cookies
const sendTokens = (res, userId) => {
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    // Set Access Token in cookie
    res.cookie('accessToken', accessToken, {
        httpOnly: true, // Prevents client-side JS from accessing
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        sameSite: 'strict', // Mitigates CSRF
        maxAge: 15 * 60 * 1000 // 15 minutes
    });

    // Set Refresh Token in cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
};

// --- Controller Functions ---

// 1. Signup
const signup = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if user already exists
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        const user = await User.create({
            username,
            email,
            password
        });

        // Send tokens and respond
        sendTokens(res, user._id);
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error during signup', error: error.message });
    }
};

// 2. Login
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user by email (include password in query)
        const user = await User.findOne({ email }).select('+password');

        // Check if user exists and password is correct
        if (user && (await user.comparePassword(password))) {
            // Send tokens and respond
            sendTokens(res, user._id);
            res.status(200).json({
                _id: user._id,
                username: user.username,
                email: user.email
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
};

// 3. Logout
const logout = (req, res) => {
    // Clear the cookies
    res.cookie('accessToken', '', {
        httpOnly: true,
        expires: new Date(0)
    });
    res.cookie('refreshToken', '', {
        httpOnly: true,
        expires: new Date(0)
    });

    res.status(200).json({ message: 'User logged out successfully' });
};

// 4. Refresh Token
const refreshToken = (req, res) => {
    const token = req.cookies.refreshToken;

    if (!token) {
        return res.status(401).json({ message: 'No refresh token provided' });
    }

    try {
        // Verify the refresh token
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

        // Generate a new access token (ONLY)
        const accessToken = generateAccessToken(decoded.id);

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.status(200).json({ message: 'Access token refreshed' });

    } catch (error) {
        res.status(401).json({ message: 'Invalid refresh token' });
    }
};

// 5. Check Auth
// This is a simple protected route to check if the accessToken is valid.
// The `protect` middleware does all the work.
const checkAuth = async (req, res) => {
    // If middleware passes, req.user is set
    try {
        const user = await User.findById(req.user).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error checking auth' });
    }
};


module.exports = {
    signup,
    login,
    logout,
    refreshToken,
    checkAuth
};
