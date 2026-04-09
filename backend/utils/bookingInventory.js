const Hotel = require("../models/Hotel");
const Transport = require("../models/Transport");
const { getDataStore } = require("./dataStore");
const supabaseHotels = require("../services/supabaseHotelsStore");
const supabaseTransports = require("../services/supabaseTransportsStore");
const { releaseInventoryForHotelBooking } = require("../services/roomInventoryService");

async function restoreBookingInventory(booking) {
  if (!booking || booking.paymentStatus !== "paid") return;
  const isSupabase = getDataStore() === "supabase";

  if (booking.bookingType === "Transport") {
    const seats = Math.max(1, Number(booking.guests || 1));
    if (isSupabase) {
      const ride = await supabaseTransports.getRideById(String(booking.listingId));
      if (!ride) return;
      await supabaseTransports.updateTransport({
        ownerId: String(ride.owner || ""),
        id: String(booking.listingId),
        updateFields: { seatsAvailable: Number(ride.seatsAvailable || 0) + seats },
      });
      return;
    }
    await Transport.findByIdAndUpdate(booking.listingId, { $inc: { seatsAvailable: seats } });
    return;
  }

  if (booking.bookingType === "Hotel") {
    if (isSupabase) {
      await releaseInventoryForHotelBooking(booking);
      return;
    }
    await releaseInventoryForHotelBooking(booking);
    await Hotel.findByIdAndUpdate(booking.listingId, { $inc: { roomsAvailable: Math.max(1, Number(booking.rooms || 1)) } });
  }
}

module.exports = { restoreBookingInventory };
