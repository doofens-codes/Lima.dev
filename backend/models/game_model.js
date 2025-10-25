const mongoose = require('mongoose');

// This schema links a user to their game data
const gameSchema = new mongoose.Schema({
    // Link to the user
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // Each user gets one game data document
    },
    highScore: {
        type: Number,
        default: 0
    },
    // You could also store a saved game state as a JSON string
    // savedState: {
    //     type: String, 
    //     default: null
    // }
}, {
    timestamps: true
});

const Game = mongoose.model('Game', gameSchema);
module.exports = Game;
