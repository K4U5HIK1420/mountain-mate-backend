const mongoose = require("mongoose");
const { getDataStore } = require("../utils/dataStore");

const connectDB = async () => {
    const store = getDataStore();
    if (store !== "mongo") return;

    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI is undefined. Check your backend/.env");

    try {
        // Added some standard connection options for stability
        const conn = await mongoose.connect(uri);
        
        // MongoDB connected
    } catch (error) {
        throw new Error(`MongoDB Connection Error: ${error.message}`);
    }
};

module.exports = connectDB;