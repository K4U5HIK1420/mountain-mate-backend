const supabaseHotels = require("./supabaseHotelsStore");
const supabaseRoomInventory = require("./supabaseRoomInventoryStore");

const DEFAULT_ROOM_TYPE = "Standard";

function toStartOfUtcDay(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addUtcDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + Number(days || 0));
  return d;
}

function dateKey(value) {
  const d = toStartOfUtcDay(value);
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

function enumerateDates(startDate, endDate) {
  const start = toStartOfUtcDay(startDate);
  const end = toStartOfUtcDay(endDate);
  if (!start || !end || start > end) return [];

  const days = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

function normalizeStayDateRange(startDate, endDate) {
  const checkIn = toStartOfUtcDay(startDate);
  if (!checkIn) return { checkIn: null, checkOut: null, stayDates: [] };

  let checkOut = toStartOfUtcDay(endDate);
  if (!checkOut || checkOut <= checkIn) {
    checkOut = addUtcDays(checkIn, 1);
  }

  const lastNight = addUtcDays(checkOut, -1);
  return {
    checkIn,
    checkOut,
    stayDates: enumerateDates(checkIn, lastNight),
  };
}

function isWeekend(date) {
  const day = new Date(date).getUTCDay();
  return day === 0 || day === 6;
}

function isPeakSeason(date) {
  const month = new Date(date).getUTCMonth() + 1;
  return [5, 6, 9, 10].includes(month);
}

function computeSuggestedPrice(basePrice, date) {
  const base = Math.max(0, Number(basePrice || 0));
  let multiplier = 1;
  if (isWeekend(date)) multiplier += 0.1;
  if (isPeakSeason(date)) multiplier += 0.2;
  return Math.round(base * multiplier);
}

function decorateInventoryRow(raw, roomType = DEFAULT_ROOM_TYPE) {
  const totalRooms = Number(raw.totalRooms || 0);
  const bookedRooms = Number(raw.bookedRooms || 0);
  const availableRooms = Math.max(0, totalRooms - bookedRooms);
  const soldOut = Boolean(raw.isSoldOut) || availableRooms <= 0;
  const status = soldOut ? "sold_out" : availableRooms < 3 ? "low" : "available";
  const color = soldOut ? "red" : availableRooms < 3 ? "orange" : "green";

  return {
    hotelId: String(raw.hotelId || ""),
    roomType: raw.roomType || roomType || DEFAULT_ROOM_TYPE,
    date: dateKey(raw.date),
    totalRooms,
    bookedRooms,
    availableRooms,
    price: Number(raw.price || 0),
    isSoldOut: soldOut,
    status,
    color,
  };
}

async function getHotelByIdAnyStore(hotelId) {
  return supabaseHotels.getHotelById(String(hotelId || ""));
}

function buildDefaultInventoryRow({ hotel, hotelId, roomType, date }) {
  const totalRooms = Math.max(0, Number(hotel?.roomsAvailable || 0));
  const bookedRooms = 0;
  return {
    hotelId: String(hotelId || hotel?._id || ""),
    roomType: String(roomType || DEFAULT_ROOM_TYPE),
    date: dateKey(date),
    totalRooms,
    bookedRooms,
    price: computeSuggestedPrice(Number(hotel?.pricePerNight || 0), date),
    isSoldOut: totalRooms <= 0,
  };
}

async function ensureHotelInventoryRows({
  hotelId,
  roomType = DEFAULT_ROOM_TYPE,
  startDate,
  endDate,
}) {
  const hotel = await getHotelByIdAnyStore(hotelId);
  if (!hotel) return { hotel: null, rows: [] };

  const dates = enumerateDates(startDate, endDate);
  if (!dates.length) return { hotel, rows: [] };

  const existing = await supabaseRoomInventory.listInventoryRows({
    hotelId: String(hotelId),
    roomType,
    startDate: dates[0],
    endDate: dates[dates.length - 1],
  });

  const byDate = new Map((existing || []).map((row) => [dateKey(row.date), row]));
  const missingRows = dates
    .filter((day) => !byDate.has(dateKey(day)))
    .map((day) => buildDefaultInventoryRow({ hotel, hotelId, roomType, date: day }));

  if (missingRows.length) {
    const inserted = await supabaseRoomInventory.upsertInventoryRows(missingRows);
    inserted.forEach((row) => byDate.set(dateKey(row.date), row));
  }

  const rows = dates.map((day) => byDate.get(dateKey(day)) || buildDefaultInventoryRow({
    hotel,
    hotelId,
    roomType,
    date: day,
  }));

  return { hotel, rows };
}

function calculateStayPricing(rows = [], roomsRequested = 1) {
  const safeRooms = Math.max(1, Number(roomsRequested || 1));
  const totalNights = rows.length;
  const rangeTotal = rows.reduce((sum, row) => sum + Math.max(0, Number(row.price || 0)), 0);

  return {
    totalNights,
    quantity: safeRooms,
    unitPrice: totalNights ? Math.round(rangeTotal / totalNights) : 0,
    totalAmount: rangeTotal * safeRooms,
    nightlyPrices: rows.map((row) => ({
      date: dateKey(row.date),
      price: Math.max(0, Number(row.price || 0)),
    })),
  };
}

async function getStayPricingQuote({
  hotelId,
  roomType = DEFAULT_ROOM_TYPE,
  startDate,
  endDate,
  rooms = 1,
}) {
  const { checkIn, checkOut, stayDates } = normalizeStayDateRange(startDate, endDate);
  if (!checkIn || !checkOut || !stayDates.length) {
    throw new Error("Invalid stay dates.");
  }

  const { hotel, rows } = await ensureHotelInventoryRows({
    hotelId,
    roomType,
    startDate: stayDates[0],
    endDate: stayDates[stayDates.length - 1],
  });

  if (!hotel) {
    throw new Error("Selected stay is no longer available.");
  }

  const byDate = new Map(rows.map((row) => [dateKey(row.date), row]));
  for (const day of stayDates) {
    const row = byDate.get(dateKey(day));
    if (!row) {
      throw new Error("Inventory data unavailable for selected dates.");
    }
    const available = Math.max(0, Number(row.totalRooms || 0) - Number(row.bookedRooms || 0));
    if (Boolean(row.isSoldOut) || available < Math.max(1, Number(rooms || 1))) {
      throw new Error(`No rooms available on ${dateKey(day)}.`);
    }
  }

  return {
    hotel,
    checkIn: dateKey(checkIn),
    checkOut: dateKey(checkOut),
    rows: stayDates.map((day) => byDate.get(dateKey(day))),
    pricing: calculateStayPricing(stayDates.map((day) => byDate.get(dateKey(day))), rooms),
  };
}

async function updateInventoryInBulk({
  hotelId,
  ownerId,
  roomType = DEFAULT_ROOM_TYPE,
  dates = [],
  startDate,
  endDate,
  totalRooms,
  bookedRooms,
  price,
  markSoldOut = false,
}) {
  const hotel = await getHotelByIdAnyStore(hotelId);
  if (!hotel) {
    throw new Error("Hotel not found.");
  }

  if (String(hotel.owner || "") !== String(ownerId || "")) {
    throw new Error("Not authorized to update this inventory.");
  }

  const explicitDates = Array.isArray(dates)
    ? dates.map(toStartOfUtcDay).filter(Boolean)
    : [];
  const rangeDates = startDate && endDate ? enumerateDates(startDate, endDate) : [];
  const allDates = [...explicitDates, ...rangeDates];
  const unique = Array.from(new Map(allDates.map((d) => [dateKey(d), d])).values());
  if (!unique.length) {
    throw new Error("At least one valid date is required.");
  }

  const existing = await supabaseRoomInventory.listInventoryRows({
    hotelId,
    roomType,
    startDate: unique[0],
    endDate: unique[unique.length - 1],
  });
  const byDate = new Map(existing.map((row) => [dateKey(row.date), row]));

  const rowsToUpsert = unique.map((day) => {
    const current =
      byDate.get(dateKey(day)) ||
      buildDefaultInventoryRow({ hotel, hotelId, roomType, date: day });

    const next = {
      hotelId: String(hotelId),
      roomType: String(roomType || DEFAULT_ROOM_TYPE),
      date: dateKey(day),
      totalRooms:
        totalRooms !== undefined
          ? Math.max(0, Number(totalRooms || 0))
          : Math.max(0, Number(current.totalRooms || 0)),
      bookedRooms:
        bookedRooms !== undefined
          ? Math.max(0, Number(bookedRooms || 0))
          : Math.max(0, Number(current.bookedRooms || 0)),
      price:
        price !== undefined
          ? Math.max(0, Number(price || 0))
          : Math.max(0, Number(current.price || 0)),
      isSoldOut: Boolean(current.isSoldOut),
    };

    if (markSoldOut) {
      next.bookedRooms = next.totalRooms;
      next.isSoldOut = true;
    } else {
      next.bookedRooms = Math.min(next.bookedRooms, next.totalRooms);
      next.isSoldOut = next.totalRooms <= 0 || next.bookedRooms >= next.totalRooms;
    }

    return next;
  });

  const saved = await supabaseRoomInventory.upsertInventoryRows(rowsToUpsert);
  return saved
    .sort((a, b) => dateKey(a.date).localeCompare(dateKey(b.date)))
    .map((row) => decorateInventoryRow(row, roomType));
}

async function reserveInventoryForHotelBooking(booking) {
  const roomType = String(booking?.roomType || DEFAULT_ROOM_TYPE);
  const roomsRequested = Math.max(1, Number(booking?.rooms || 1));
  const { checkIn, checkOut, stayDates } = normalizeStayDateRange(
    booking?.startDate || booking?.date,
    booking?.endDate
  );
  if (!stayDates.length) throw new Error("Invalid stay dates.");

  const hotel = await getHotelByIdAnyStore(booking?.listingId);
  if (!hotel) throw new Error("Selected stay is no longer available.");

  await ensureHotelInventoryRows({
    hotelId: String(booking.listingId),
    roomType,
    startDate: stayDates[0],
    endDate: stayDates[stayDates.length - 1],
  });

  return supabaseRoomInventory.reserveInventoryRows({
    hotelId: String(booking.listingId),
    roomType,
    startDate: checkIn,
    endDate: checkOut,
    rooms: roomsRequested,
    defaultTotalRooms: Number(hotel.roomsAvailable || 0),
    defaultPrice: Number(hotel.pricePerNight || 0),
  });
}

async function releaseInventoryForHotelBooking(booking) {
  const roomType = String(booking?.roomType || DEFAULT_ROOM_TYPE);
  const rooms = Math.max(1, Number(booking?.rooms || 1));
  const { checkIn, checkOut, stayDates } = normalizeStayDateRange(
    booking?.startDate || booking?.date,
    booking?.endDate
  );
  if (!stayDates.length) return null;

  const hotel = await getHotelByIdAnyStore(booking?.listingId);
  if (!hotel) return null;

  return supabaseRoomInventory.releaseInventoryRows({
    hotelId: String(booking.listingId),
    roomType,
    startDate: checkIn,
    endDate: checkOut,
    rooms,
    defaultTotalRooms: Number(hotel.roomsAvailable || 0),
    defaultPrice: Number(hotel.pricePerNight || 0),
  });
}

async function applyInventorySnapshotToHotels(hotels = [], date, roomType = DEFAULT_ROOM_TYPE) {
  if (!Array.isArray(hotels) || !hotels.length || !date) return hotels;

  const snapshotDate = dateKey(date);
  const inventoryRows = await supabaseRoomInventory.listInventoryRowsForHotelsOnDate({
    hotelIds: hotels.map((hotel) => String(hotel._id || "")),
    roomType,
    date: snapshotDate,
  });
  const byHotel = new Map(inventoryRows.map((row) => [String(row.hotelId || ""), decorateInventoryRow(row, roomType)]));

  return hotels.map((hotel) => {
    const row = byHotel.get(String(hotel._id || ""));
    if (!row) {
      const baseAvailable = Math.max(0, Number(hotel.roomsAvailable || 0));
      return {
        ...hotel,
        isAvailableOnDate: baseAvailable > 0,
        roomsAvailableOnDate: baseAvailable,
      };
    }

    return {
      ...hotel,
      pricePerNight: Number(row.price || hotel.pricePerNight || 0),
      isAvailableOnDate: row.availableRooms > 0 && !row.isSoldOut,
      roomsAvailableOnDate: row.availableRooms,
    };
  });
}

module.exports = {
  DEFAULT_ROOM_TYPE,
  toStartOfUtcDay,
  dateKey,
  enumerateDates,
  normalizeStayDateRange,
  decorateInventoryRow,
  ensureHotelInventoryRows,
  calculateStayPricing,
  getStayPricingQuote,
  updateInventoryInBulk,
  reserveInventoryForHotelBooking,
  releaseInventoryForHotelBooking,
  applyInventorySnapshotToHotels,
};
