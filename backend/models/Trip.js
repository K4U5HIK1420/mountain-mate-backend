const mongoose = require("mongoose");

const tripDaySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },
    title: { type: String, default: "" },
    location: { type: String, default: "" },
    activity: { type: String, default: "" },
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    // Supabase auth.users.id (UUID string)
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    itinerary: { type: [tripDaySchema], default: [] },
    status: { type: String, enum: ["draft", "booked"], default: "draft" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trip", tripSchema);