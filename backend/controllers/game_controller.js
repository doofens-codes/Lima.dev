const Game = require('../models/game_model');
const User = require('../models/user_model'); // <-- Import User model
// Get user's game data
const getGameData = async (req, res) => {
    try {
        // Find (or create) game data for the user
        let gameData = await Game.findOne({ user: req.user });

        if (!gameData) {
            // If user has no game data yet, create it
            gameData = await Game.create({ user: req.user, highScore: 0 });
        }

        res.status(200).json(gameData);
    } catch (error) {
        res.status(500).json({ message: 'Server error getting game data' });
    }
};

// Update user's game data (e.g., save high score)
const updateGameData = async (req, res) => {
    const { highScore } = req.body;

    try {
        // Find the user's game data
        const gameData = await Game.findOne({ user: req.user });

        if (!gameData) {
            return res.status(404).json({ message: 'Game data not found' });
        }

        // Only update if the new score is higher
        if (highScore > gameData.highScore) {
            gameData.highScore = highScore;
            await gameData.save();
        }

        res.status(200).json(gameData);

    } catch (error) {
        res.status(500).json({ message: 'Server error updating game data' });
    }
};

// --- *** NEW FUNCTION ADDED BELOW *** ---

/**
 * @desc    Get the top 10 leaderboard (highest scores)
 * @route   GET /api/game/leaderboard
 * @access  Public
 */
const getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await Game.find() // Find all game data
            .sort({ highScore: -1 }) // Sort by highScore descending
            .limit(10) // Get only the top 10
            .populate('user', 'username') // Populate the 'user' field, only selecting the 'username'
            .select('highScore user'); // Select highScore and the populated user field

        // Check if populate worked and structure the response
        const formattedLeaderboard = leaderboard.map(entry => ({
            username: entry.user ? entry.user.username : 'Unknown User', // Handle case where user might be deleted
            highScore: entry.highScore
        }));

        res.status(200).json(formattedLeaderboard);

    } catch (error) {
        console.error('Error getting leaderboard:', error); // Log the error
        res.status(500).json({ message: 'Server error getting leaderboard' });
    }
};


module.exports = {
    getGameData,
    updateGameData,
    getLeaderboard // <-- Export the new function
};