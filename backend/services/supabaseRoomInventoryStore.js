const { getSupabaseClient } = require("../utils/supabaseClient");

const TABLE = "hotel_room_inventory";

function isMissingRelationError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("relation") && message.includes("does not exist")
  ) || message.includes(`could not find the table '${TABLE}'`);
}

function createMissingTableError() {
  return new Error(
    `Supabase table '${TABLE}' is missing. Run the SQL migration in backend/sql/2026-04-09_hotel_room_inventory.sql before using hotel inventory.`
  );
}

function toIsoDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function mapInventoryRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    hotelId: row.hotel_id || row.hotelId || "",
    roomType: row.room_type || row.roomType || "Standard",
    date: row.stay_date || row.date || null,
    totalRooms: Number(row.total_rooms || row.totalRooms || 0),
    bookedRooms: Number(row.booked_rooms || row.bookedRooms || 0),
    price: Number(row.price || 0),
    isSoldOut: Boolean(row.is_sold_out ?? row.isSoldOut ?? false),
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

function toRowPayload(row = {}) {
  return {
    hotel_id: String(row.hotelId || ""),
    room_type: String(row.roomType || "Standard"),
    stay_date: toIsoDate(row.date),
    total_rooms: Math.max(0, Number(row.totalRooms || 0)),
    booked_rooms: Math.max(0, Number(row.bookedRooms || 0)),
    price: Math.max(0, Number(row.price || 0)),
    is_sold_out: Boolean(row.isSoldOut),
  };
}

async function listInventoryRows({ hotelId, roomType, startDate, endDate }) {
  const supabase = getSupabaseClient();
  const query = supabase
    .from(TABLE)
    .select("*")
    .eq("hotel_id", String(hotelId || ""))
    .eq("room_type", String(roomType || "Standard"))
    .gte("stay_date", toIsoDate(startDate))
    .lte("stay_date", toIsoDate(endDate))
    .order("stay_date", { ascending: true });

  const { data, error } = await query;
  if (error) {
    if (isMissingRelationError(error)) return [];
    throw new Error(error.message);
  }

  return (data || []).map(mapInventoryRow);
}

async function listInventoryRowsForHotelsOnDate({ hotelIds = [], roomType, date }) {
  if (!hotelIds.length) return [];

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .in("hotel_id", hotelIds.map((id) => String(id)))
    .eq("room_type", String(roomType || "Standard"))
    .eq("stay_date", toIsoDate(date));

  if (error) {
    if (isMissingRelationError(error)) return [];
    throw new Error(error.message);
  }

  return (data || []).map(mapInventoryRow);
}

async function upsertInventoryRows(rows = []) {
  if (!rows.length) return [];

  const supabase = getSupabaseClient();
  const payload = rows.map(toRowPayload);
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(payload, { onConflict: "hotel_id,room_type,stay_date" })
    .select("*");

  if (error) {
    if (isMissingRelationError(error)) {
      throw createMissingTableError();
    }
    throw new Error(error.message);
  }

  return (data || []).map(mapInventoryRow);
}

async function reserveInventoryRows({
  hotelId,
  roomType,
  startDate,
  endDate,
  rooms,
  defaultTotalRooms,
  defaultPrice,
}) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("reserve_hotel_inventory", {
    p_hotel_id: String(hotelId || ""),
    p_room_type: String(roomType || "Standard"),
    p_start_date: toIsoDate(startDate),
    p_end_date: toIsoDate(endDate),
    p_rooms: Math.max(1, Number(rooms || 1)),
    p_default_total_rooms: Math.max(0, Number(defaultTotalRooms || 0)),
    p_default_price: Math.max(0, Number(defaultPrice || 0)),
  });

  if (error) {
    if (isMissingRelationError(error)) {
      throw createMissingTableError();
    }
    throw new Error(error.message);
  }

  return data;
}

async function releaseInventoryRows({
  hotelId,
  roomType,
  startDate,
  endDate,
  rooms,
  defaultTotalRooms,
  defaultPrice,
}) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("release_hotel_inventory", {
    p_hotel_id: String(hotelId || ""),
    p_room_type: String(roomType || "Standard"),
    p_start_date: toIsoDate(startDate),
    p_end_date: toIsoDate(endDate),
    p_rooms: Math.max(1, Number(rooms || 1)),
    p_default_total_rooms: Math.max(0, Number(defaultTotalRooms || 0)),
    p_default_price: Math.max(0, Number(defaultPrice || 0)),
  });

  if (error) {
    if (isMissingRelationError(error)) {
      throw createMissingTableError();
    }
    throw new Error(error.message);
  }

  return data;
}

module.exports = {
  listInventoryRows,
  listInventoryRowsForHotelsOnDate,
  upsertInventoryRows,
  reserveInventoryRows,
  releaseInventoryRows,
};
