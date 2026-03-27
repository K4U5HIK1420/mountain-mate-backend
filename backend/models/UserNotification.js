const mongoose = require("mongoose");

const userNotificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["booking_request", "booking_confirmed", "booking_declined", "booking_cancelled", "booking_paid", "system"],
      default: "system",
    },
    read: { type: Boolean, default: false },
    data: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserNotification", userNotificationSchema);
