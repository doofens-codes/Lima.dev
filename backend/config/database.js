const mongoose = require('mongoose');

// Define the async function to connect to the database
const connectDB = async () => {
    try {
        // Connect to MongoDB using the URI from .env
        const conn = await mongoose.connect(process.env.DB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        // Exit process with failure
        process.exit(1);
    }
};

// --- This is the most important line! ---
// You MUST export the function to be used in other files.
module.exports = connectDB;

