const mongoose = require("mongoose");

const hotelSchema = new mongoose.Schema({
    hotelName: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    pricePerNight: {
        type: Number,
        required: true
    },
    roomsAvailable: {
        type: Number,
        required: true
    },
    contactNumber: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    images: {
        type: [String]
    },
    // --- OWNER LINKING (Naya Field) ---
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // User model se link hai
        required: true
    },
    // --- APPROVED LOGIC ---
    isVerified: { 
        type: Boolean, 
        default: false 
    },
    status: {
        type: String,
        enum: ["pending", "approved"],
        default: "pending"
    }
}, 
{ timestamps: true });

module.exports = mongoose.model("Hotel", hotelSchema);