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
    // --- NAYE FIELDS YAHAN SE HAIN (APPROVED LOGIC) ---
    isVerified: { 
        type: Boolean, 
        default: false // Jab tak admin 'true' nahi karega, false rahega
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    }
}, 
{ timestamps: true });

module.exports = mongoose.model("Hotel", hotelSchema);