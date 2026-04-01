const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
    unique: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  listingType: {
    type: String,
    enum: ["Hotel", "Transport"],
    required: true,
  },
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "listingType",
  },
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hotel",
    default: null,
  },
  transportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transport",
    default: null,
  },
  customerName: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  comment: {
    type: String,
    required: true
  }
}, { timestamps: true });

reviewSchema.index({ listingType: 1, listingId: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
