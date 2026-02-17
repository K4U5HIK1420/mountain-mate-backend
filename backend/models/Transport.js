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
    }
}, { timestamps: true });

module.exports = mongoose.model("Transport", transportSchema);
