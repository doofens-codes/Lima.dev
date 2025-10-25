const express = require('express');
const { getGameData, getLeaderboard,updateGameData } = require('../controllers/game_controller');
const { protect } = require('../middleware/auth_middleware');

const router = express.Router();

// All game routes are protected
router.use(protect);

// @route   GET /api/game
// @desc    Get user's game data (e.g., high score)
router.get('/', getGameData);

router.get('/leaderboard', getLeaderboard);
// @route   POST /api/game
// @desc    Save/update user's game data
router.post('/', updateGameData);


module.exports = router;
