const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
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
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "completed", "cancelled"],
        default: "pending",
    }
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
