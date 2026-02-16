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
    }
}, { timestamps: true });

module.exports = mongoose.model("Hotel", hotelSchema);
