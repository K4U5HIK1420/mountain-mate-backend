const { getSupabaseClient } = require("../utils/supabaseClient");

function extractMissingColumn(errorMessage = "") {
  const match = String(errorMessage).match(/Could not find the '([^']+)' column/i);
  return match ? match[1] : "";
}

function isUuid(value = "") {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value));
}

function toDateValue(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

async function insertWithSchemaFallback(supabase, table, payload) {
  let current = { ...payload };

  for (let i = 0; i < 25; i += 1) {
    const { data, error } = await supabase.from(table).insert(current).select("*").single();
    if (!error) return { data, error: null };

    const missing = extractMissingColumn(error.message);
    if (!missing || !(missing in current)) {
      return { data: null, error };
    }
    delete current[missing];
  }

  return { data: null, error: { message: "Insert failed due to schema mismatch." } };
}

async function updateWithSchemaFallback(supabase, table, id, payload) {
  let current = { ...payload };

  for (let i = 0; i < 25; i += 1) {
    const { data, error } = await supabase
      .from(table)
      .update(current)
      .eq("id", id)
      .select("*")
      .single();

    if (!error) return { data, error: null };

    const missing = extractMissingColumn(error.message);
    if (!missing || !(missing in current)) {
      return { data: null, error };
    }
    delete current[missing];
  }

  return { data: null, error: { message: "Update failed due to schema mismatch." } };
}

function mapBookingRow(row) {
  if (!row) return null;
  return {
    _id: row.id,
    userId: row.user_id || row.userId || null,
    ownerId: row.owner_id || row.ownerId || null,
    listingLabel: row.listing_label || row.listingLabel || "",
    customerName: row.customer_name || "",
    phoneNumber: row.phone_number || "",
    bookingType: row.booking_type || "",
    listingId: row.listing_supabase_id || row.listing_mongo_id || row.listing_id || "",
    date: row.date || null,
    startDate: row.start_date || null,
    endDate: row.end_date || null,
    guests: Number(row.guests || 1),
    rooms: Number(row.rooms || 1),
    amount: Number(row.amount || 0),
    currency: row.currency || "INR",
    status: row.status || "pending",
    paymentId: row.payment_id || "",
    orderId: row.order_id || "",
    paymentStatus: row.payment_status || "pending",
    liveTracking: row.live_tracking || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

function buildInsertPayload(data = {}) {
  const listingId = String(data.listingId || "");
  const payload = {
    customer_name: data.customerName || "",
    phone_number: data.phoneNumber || "",
    booking_type: data.bookingType || "",
    date: toDateValue(data.date),
    status: data.status || "pending",
    payment_status: data.paymentStatus || "pending",
    user_id: data.userId || null,
    owner_id: data.ownerId || null,
    listing_label: data.listingLabel || "",
    start_date: toDateValue(data.startDate),
    end_date: toDateValue(data.endDate),
    guests: Number(data.guests || 1),
    rooms: Number(data.rooms || 1),
    amount: Number(data.amount || 0),
    currency: data.currency || "INR",
    live_tracking: data.liveTracking || null,
  };

  if (isUuid(listingId)) {
    payload.listing_supabase_id = listingId;
  } else {
    payload.listing_mongo_id = listingId;
  }

  return payload;
}

function buildUpdatePayload(patch = {}) {
  const payload = {};
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.paymentId !== undefined) payload.payment_id = patch.paymentId;
  if (patch.orderId !== undefined) payload.order_id = patch.orderId;
  if (patch.paymentStatus !== undefined) payload.payment_status = patch.paymentStatus;
  if (patch.liveTracking !== undefined) payload.live_tracking = patch.liveTracking;
  if (patch.amount !== undefined) payload.amount = Number(patch.amount || 0);
  return payload;
}

async function createBooking(data) {
  const supabase = getSupabaseClient();
  const payload = buildInsertPayload(data);
  const { data: row, error } = await insertWithSchemaFallback(supabase, "bookings", payload);
  if (error) throw new Error(error.message);
  return mapBookingRow(row);
}

async function getBookingById(id) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("bookings").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return mapBookingRow(data);
}

async function getBookingByIdForUser(id, userId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return mapBookingRow(data);
}

async function listBookingsByUserId(userId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapBookingRow);
}

async function listBookingsByOwnerId(ownerId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapBookingRow);
}

async function updateBookingById(id, patch) {
  const supabase = getSupabaseClient();
  const payload = buildUpdatePayload(patch);
  if (!Object.keys(payload).length) {
    return getBookingById(id);
  }
  const { data, error } = await updateWithSchemaFallback(supabase, "bookings", id, payload);
  if (error) throw new Error(error.message);
  return mapBookingRow(data);
}

module.exports = {
  createBooking,
  getBookingById,
  getBookingByIdForUser,
  listBookingsByUserId,
  listBookingsByOwnerId,
  updateBookingById,
  mapBookingRow,
};
