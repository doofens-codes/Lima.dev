// --- Imports ---
require('dotenv').config(); // Load environment variables
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path'); // <-- IMPORT PATH MODULE
const connectDB = require('./config/database'); // <-- PATH FIXED (was './backend/config/database')

// --- Route Imports ---
const authRoutes = require('./routes/auth_routes'); // <-- PATH FIXED (was './backend/routes/auth_routes')
const userRoutes = require('./routes/user_routes'); // <-- PATH FIXED
const donationRoutes = require('./routes/donation_routes'); // <-- PATH FIXED
const gameRoutes = require('./routes/game_routes'); // <-- PATH FIXED

// --- Initialization ---
const app = express();
const PORT = process.env.PORT || 5000;

// --- Database Connection ---
connectDB();

// --- Middleware ---
app.use(express.json()); // To parse JSON bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded bodies
app.use(cookieParser()); // To parse cookies

// --- Static Frontend Serving ---
// This serves your 'frontend' folder.
// Since server.js is IN /backend, we go UP one level ('..') to find /frontend
app.use(express.static(path.join(__dirname, '..', 'frontend'))); // <-- PATH FIXED


// --- API Routes ---
// All API calls will be prefixed with /api
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/game', gameRoutes);

// --- 404 Handler for API ---
// A simple handler for API routes that don't exist
app.use('/api/*', (req, res) => {
    res.status(404).json({ message: 'API endpoint not found' });
});

// --- Frontend Catch-all ---
// If no API route or static file is matched, send the main index.html file.
app.use('*', (req, res) => {
    // We must go UP one level ('..') to find the /frontend folder
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html')); // <-- PATH FIXED
});

// --- Server Start ---
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

