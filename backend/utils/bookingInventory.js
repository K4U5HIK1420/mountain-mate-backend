const Hotel = require("../models/Hotel");
const Transport = require("../models/Transport");

async function restoreBookingInventory(booking) {
  if (!booking || booking.paymentStatus !== "paid") return;

  if (booking.bookingType === "Transport") {
    const seats = Math.max(1, Number(booking.guests || 1));
    await Transport.findByIdAndUpdate(booking.listingId, { $inc: { seatsAvailable: seats } });
    return;
  }

  if (booking.bookingType === "Hotel") {
    const rooms = Math.max(1, Number(booking.rooms || 1));
    await Hotel.findByIdAndUpdate(booking.listingId, { $inc: { roomsAvailable: rooms } });
  }
}

module.exports = { restoreBookingInventory };
