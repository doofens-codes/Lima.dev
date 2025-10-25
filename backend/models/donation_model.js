const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
    // Link to the user who donated
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: [true, 'Please provide a donation amount']
    },
    // Optional: for tracking payment status
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        default: 'Completed' // Assuming direct success for this example
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

const Donation = mongoose.model('Donation', donationSchema);
module.exports = Donation;
