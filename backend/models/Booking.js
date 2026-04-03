const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    // Supabase auth.users.id (UUID string)
    userId: { type: String, default: null, index: true },
    ownerId: { type: String, default: null, index: true },
    listingLabel: { type: String, default: "" },
    customerName: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    bookingType: {
        type: String,
        enum: ["Transport", "Hotel"],
        required: true
    },
    listingId: {
        type: String,
        required: true,
        index: true
    },
    // Legacy single-date booking (still supported)
    date: { type: Date, required: true },
    // New stay booking range (optional, for Hotel)
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    guests: { type: Number, default: 1 },
    rooms: { type: Number, default: 1 },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    status: {
        type: String,
        enum: ["pending", "confirmed", "completed", "cancelled", "declined"],
        default: "pending",
    },
    paymentId: {
        type: String,
    },
    orderId: {
        type: String,
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending"
    },
    liveTracking: {
        status: {
            type: String,
            enum: ["searching", "accepted", "on_the_way", "completed", "declined"],
            default: "searching"
        },
        driverLocation: {
            lat: { type: Number, default: null },
            lng: { type: Number, default: null },
            heading: { type: Number, default: null },
            speed: { type: Number, default: null },
            accuracy: { type: Number, default: null },
            updatedAt: { type: Date, default: null }
        },
        riderLocation: {
            lat: { type: Number, default: null },
            lng: { type: Number, default: null },
            heading: { type: Number, default: null },
            speed: { type: Number, default: null },
            accuracy: { type: Number, default: null },
            updatedAt: { type: Date, default: null }
        }
    }

}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
