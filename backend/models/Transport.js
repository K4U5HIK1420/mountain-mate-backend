const mongoose = require("mongoose");

const transportSchema = new mongoose.Schema({
    vehicleType: {
        type: String,
        required: true
    },
    routeFrom: {
        type: String,
        required: true
    },
    routeTo: {
        type: String,
        required: true
    },
    pricePerSeat: {
        type: Number,
        required: true
    },
    seatsAvailable: {
        type: Number,
        required: true
    },
    driverName: {
        type: String,
        required: true
    },
    contactNumber: {
        type: String,
        required: true
    },
    images: {
        type: [String],
        required: true
    },
    status: {
        type: String,
        default: "pending"
    },
    isVerified: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

module.exports = mongoose.model("Transport", transportSchema);
