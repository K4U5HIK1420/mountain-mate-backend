const mongoose = require("mongoose");

const roomInventorySchema = new mongoose.Schema(
  {
    hotelId: {
      type: String,
      required: true,
      index: true,
    },
    roomType: {
      type: String,
      default: "Standard",
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    totalRooms: {
      type: Number,
      required: true,
      min: 0,
    },
    bookedRooms: {
      type: Number,
      default: 0,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    isSoldOut: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

roomInventorySchema.index({ hotelId: 1, roomType: 1, date: 1 }, { unique: true });

roomInventorySchema.virtual("availableRooms").get(function availableRooms() {
  const available = Number(this.totalRooms || 0) - Number(this.bookedRooms || 0);
  return Math.max(0, available);
});

module.exports = mongoose.model("RoomInventory", roomInventorySchema);

