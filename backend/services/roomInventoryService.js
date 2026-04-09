const Hotel = require("../models/Hotel");
const RoomInventory = require("../models/RoomInventory");
const { getDataStore } = require("../utils/dataStore");
const supabaseHotels = require("./supabaseHotelsStore");

const DEFAULT_ROOM_TYPE = "Standard";

function toStartOfUtcDay(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
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
  if (getDataStore() === "supabase") {
    return supabaseHotels.getHotelById(String(hotelId || ""));
  }
  return Hotel.findById(hotelId).lean();
}

function buildSyntheticRowsFromHotel({ hotel, dates, roomType = DEFAULT_ROOM_TYPE }) {
  const totalRooms = Math.max(0, Number(hotel?.roomsAvailable || 0));
  const price = Math.max(0, Number(hotel?.pricePerNight || 0));
  return (dates || []).map((day) =>
    decorateInventoryRow(
      {
        hotelId: String(hotel?._id || ""),
        roomType,
        date: day,
        totalRooms,
        bookedRooms: 0,
        price,
        isSoldOut: totalRooms <= 0,
      },
      roomType
    )
  );
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

  if (getDataStore() === "supabase") {
    return {
      hotel,
      rows: buildSyntheticRowsFromHotel({ hotel, dates, roomType }),
    };
  }

  const existing = await RoomInventory.find({
    hotelId: String(hotelId),
    roomType: roomType || DEFAULT_ROOM_TYPE,
    date: { $gte: dates[0], $lte: dates[dates.length - 1] },
  }).lean();

  const byDate = new Map(existing.map((row) => [dateKey(row.date), row]));
  const ops = [];

  for (const day of dates) {
    const key = dateKey(day);
    if (!byDate.has(key)) {
      const defaultRow = {
        hotelId: String(hotelId),
        roomType: roomType || DEFAULT_ROOM_TYPE,
        date: day,
        totalRooms: Number(hotel.roomsAvailable || 0),
        bookedRooms: 0,
        price: computeSuggestedPrice(Number(hotel.pricePerNight || 0), day),
        isSoldOut: Number(hotel.roomsAvailable || 0) <= 0,
      };
      ops.push({
        updateOne: {
          filter: {
            hotelId: defaultRow.hotelId,
            roomType: defaultRow.roomType,
            date: defaultRow.date,
          },
          update: { $setOnInsert: defaultRow },
          upsert: true,
        },
      });
    }
  }

  if (ops.length) {
    await RoomInventory.bulkWrite(ops, { ordered: false });
  }

  const rows = await RoomInventory.find({
    hotelId: String(hotelId),
    roomType: roomType || DEFAULT_ROOM_TYPE,
    date: { $gte: dates[0], $lte: dates[dates.length - 1] },
  })
    .sort({ date: 1 })
    .lean();

  return { hotel, rows };
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

  const patch = {};
  if (totalRooms !== undefined) patch.totalRooms = Math.max(0, Number(totalRooms || 0));
  if (bookedRooms !== undefined) patch.bookedRooms = Math.max(0, Number(bookedRooms || 0));
  if (price !== undefined) patch.price = Math.max(0, Number(price || 0));
  if (markSoldOut === true) {
    patch.isSoldOut = true;
    patch.bookedRooms =
      patch.totalRooms !== undefined
        ? patch.totalRooms
        : Math.max(0, Number(totalRooms || hotel.roomsAvailable || 0));
  } else if (markSoldOut === false && (totalRooms !== undefined || bookedRooms !== undefined)) {
    patch.isSoldOut = false;
  }

  if (getDataStore() === "supabase") {
    const hotelUpdate = {};
    if (price !== undefined) hotelUpdate.pricePerNight = Math.max(0, Number(price || 0));
    if (totalRooms !== undefined) hotelUpdate.roomsAvailable = Math.max(0, Number(totalRooms || 0));
    if (markSoldOut === true) hotelUpdate.roomsAvailable = 0;

    if (Object.keys(hotelUpdate).length > 0) {
      await supabaseHotels.updateHotel({
        ownerId: String(ownerId || ""),
        id: String(hotelId),
        updateData: hotelUpdate,
      });
    }

    const refreshedHotel = await getHotelByIdAnyStore(hotelId);
    return buildSyntheticRowsFromHotel({
      hotel: refreshedHotel || hotel,
      dates: unique,
      roomType,
    });
  }

  const ops = unique.map((day) => {
    const insertDefaults = {
      hotelId: String(hotelId),
      roomType: roomType || DEFAULT_ROOM_TYPE,
      date: day,
      totalRooms: Number(hotel.roomsAvailable || 0),
      bookedRooms: 0,
      price: computeSuggestedPrice(Number(hotel.pricePerNight || 0), day),
      isSoldOut: Number(hotel.roomsAvailable || 0) <= 0,
    };

    return {
      updateOne: {
        filter: {
          hotelId: String(hotelId),
          roomType: roomType || DEFAULT_ROOM_TYPE,
          date: day,
        },
        update: {
          $setOnInsert: insertDefaults,
          ...(Object.keys(patch).length ? { $set: patch } : {}),
        },
        upsert: true,
      },
    };
  });

  if (ops.length) {
    await RoomInventory.bulkWrite(ops, { ordered: false });
  }

  const rows = await RoomInventory.find({
    hotelId: String(hotelId),
    roomType: roomType || DEFAULT_ROOM_TYPE,
    date: { $gte: unique[0], $lte: unique[unique.length - 1] },
  })
    .sort({ date: 1 })
    .lean();

  return rows.map((row) => decorateInventoryRow(row, roomType));
}

async function reserveInventoryForHotelBooking(booking) {
  const roomsRequested = Math.max(1, Number(booking?.rooms || 1));
  const roomType = String(booking?.roomType || DEFAULT_ROOM_TYPE);
  const start = toStartOfUtcDay(booking?.startDate || booking?.date);
  const end = toStartOfUtcDay(booking?.endDate || booking?.startDate || booking?.date);
  const dates = enumerateDates(start, end);
  if (!dates.length) throw new Error("Invalid stay dates.");

  const { hotel, rows } = await ensureHotelInventoryRows({
    hotelId: String(booking.listingId),
    roomType,
    startDate: dates[0],
    endDate: dates[dates.length - 1],
  });
  if (!hotel) throw new Error("Selected stay is no longer available.");

  const byDate = new Map(rows.map((row) => [dateKey(row.date), row]));
  for (const day of dates) {
    const row = byDate.get(dateKey(day));
    if (!row) throw new Error("Inventory data unavailable for selected dates.");
    const available = Math.max(0, Number(row.totalRooms || 0) - Number(row.bookedRooms || 0));
    if (row.isSoldOut || available < roomsRequested) {
      throw new Error(`No rooms available on ${dateKey(day)}.`);
    }
  }

  await RoomInventory.bulkWrite(
    dates.map((day) => ({
      updateOne: {
        filter: {
          hotelId: String(booking.listingId),
          roomType,
          date: day,
          isSoldOut: { $ne: true },
          $expr: { $gte: [{ $subtract: ["$totalRooms", "$bookedRooms"] }, roomsRequested] },
        },
        update: {
          $inc: { bookedRooms: roomsRequested },
        },
      },
    })),
    { ordered: true }
  );
}

async function releaseInventoryForHotelBooking(booking) {
  const rooms = Math.max(1, Number(booking?.rooms || 1));
  const roomType = String(booking?.roomType || DEFAULT_ROOM_TYPE);
  const start = toStartOfUtcDay(booking?.startDate || booking?.date);
  const end = toStartOfUtcDay(booking?.endDate || booking?.startDate || booking?.date);
  const dates = enumerateDates(start, end);
  if (!dates.length) return;

  await RoomInventory.bulkWrite(
    dates.map((day) => ({
      updateOne: {
        filter: {
          hotelId: String(booking.listingId),
          roomType,
          date: day,
        },
        update: {
          $inc: { bookedRooms: -rooms },
          $set: { isSoldOut: false },
        },
      },
    })),
    { ordered: false }
  );

  await RoomInventory.updateMany(
    {
      hotelId: String(booking.listingId),
      roomType,
      date: { $gte: dates[0], $lte: dates[dates.length - 1] },
      bookedRooms: { $lt: 0 },
    },
    { $set: { bookedRooms: 0 } }
  );
}

module.exports = {
  DEFAULT_ROOM_TYPE,
  toStartOfUtcDay,
  dateKey,
  enumerateDates,
  decorateInventoryRow,
  ensureHotelInventoryRows,
  updateInventoryInBulk,
  reserveInventoryForHotelBooking,
  releaseInventoryForHotelBooking,
};
