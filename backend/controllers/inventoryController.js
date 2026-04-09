const Hotel = require("../models/Hotel");
const { getDataStore } = require("../utils/dataStore");
const supabaseHotels = require("../services/supabaseHotelsStore");
const {
  DEFAULT_ROOM_TYPE,
  toStartOfUtcDay,
  decorateInventoryRow,
  ensureHotelInventoryRows,
  updateInventoryInBulk,
} = require("../services/roomInventoryService");

function getDefaultRange() {
  const start = toStartOfUtcDay(new Date());
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 59);
  return { start, end };
}

exports.getHotelInventory = async (req, res, next) => {
  try {
    const { hotelId } = req.params;
    const roomType = String(req.query.roomType || DEFAULT_ROOM_TYPE);
    const { start: defaultStart, end: defaultEnd } = getDefaultRange();
    const start = toStartOfUtcDay(req.query.startDate || defaultStart);
    const end = toStartOfUtcDay(req.query.endDate || defaultEnd);

    if (!start || !end || start > end) {
      return res.status(400).json({ success: false, message: "Invalid startDate/endDate range." });
    }

    const { hotel, rows } = await ensureHotelInventoryRows({
      hotelId: String(hotelId),
      roomType,
      startDate: start,
      endDate: end,
    });

    if (!hotel) {
      return res.status(404).json({ success: false, message: "Hotel not found." });
    }

    return res.json({
      success: true,
      hotel: {
        _id: hotel._id,
        hotelName: hotel.hotelName,
        location: hotel.location,
        basePricePerNight: hotel.pricePerNight,
      },
      roomType,
      data: rows.map((row) => decorateInventoryRow(row, roomType)),
    });
  } catch (err) {
    next(err);
  }
};

exports.updateHotelInventory = async (req, res, next) => {
  try {
    const {
      hotelId,
      dates,
      startDate,
      endDate,
      totalRooms,
      bookedRooms,
      price,
      markSoldOut,
      roomType,
    } = req.body || {};

    if (!hotelId) {
      return res.status(400).json({ success: false, message: "hotelId is required." });
    }

    const updated = await updateInventoryInBulk({
      hotelId: String(hotelId),
      ownerId: String(req.user?.id || req.user?._id || ""),
      roomType: String(roomType || DEFAULT_ROOM_TYPE),
      dates: Array.isArray(dates) ? dates : [],
      startDate,
      endDate,
      totalRooms,
      bookedRooms,
      price,
      markSoldOut: Boolean(markSoldOut),
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("inventory:updated", {
        hotelId: String(hotelId),
        roomType: String(roomType || DEFAULT_ROOM_TYPE),
      });
    }

    return res.json({
      success: true,
      message: "Inventory updated successfully.",
      data: updated,
    });
  } catch (err) {
    if (String(err.message || "").toLowerCase().includes("not authorized")) {
      return res.status(403).json({ success: false, message: err.message });
    }
    if (String(err.message || "").toLowerCase().includes("required")) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

exports.listOwnerHotels = async (req, res, next) => {
  try {
    const ownerId = String(req.user?.id || req.user?._id || "");
    let hotels = [];
    if (getDataStore() === "supabase") {
      const rows = await supabaseHotels.getMyHotels(ownerId);
      hotels = (rows || []).map((h) => ({
        _id: h._id,
        hotelName: h.hotelName,
        location: h.location,
        pricePerNight: h.pricePerNight,
        roomsAvailable: h.roomsAvailable,
      }));
    } else {
      hotels = await Hotel.find({ owner: ownerId })
        .select("_id hotelName location pricePerNight roomsAvailable")
        .sort({ createdAt: -1 })
        .lean();
    }

    return res.json({ success: true, data: hotels });
  } catch (err) {
    next(err);
  }
};
