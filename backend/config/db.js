const mongoose = require("mongoose");

const connectDB = async () => {
    // Check if the URI actually exists
    const uri = process.env.MONGO_URI;

    if (!uri) {
        console.error("❌ ERROR: MONGO_URI is undefined. Check your .env file!");
        process.exit(1);
    }

    try {
        // Added some standard connection options for stability
        const conn = await mongoose.connect(uri);
        
        console.log(`MongoDB Connected: ${conn.connection.host} ✅`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;