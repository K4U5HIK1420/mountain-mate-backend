const mongoose = require("mongoose");

const transportSchema = new mongoose.Schema({
    // ✅ OWNER LINKING (Sabse Zaruri)
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    vehicleModel: { // Example: Innova Crysta, Bolero
        type: String,
        required: true
    },
    vehicleType: { // Example: SUV, Hatchback, Bus
        type: String,
        required: true
    },
    plateNumber: { // Example: UK 13 TA 1234
        type: String,
        required: true,
        unique: true
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
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model("Transport", transportSchema);