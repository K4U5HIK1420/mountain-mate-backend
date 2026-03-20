const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    // Supabase auth.users.id (UUID string)
    userId: { type: String, default: null, index: true },
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
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: "bookingType"
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
        enum: ["pending", "confirmed", "completed", "cancelled"],
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
    }

}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
