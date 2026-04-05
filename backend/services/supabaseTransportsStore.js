const { getSupabaseClient } = require("../utils/supabaseClient");

function extractMissingColumn(errorMessage = "") {
  const match = String(errorMessage).match(/Could not find the '([^']+)' column/i);
  return match ? match[1] : "";
}

async function insertWithSchemaFallback(supabase, table, payload) {
  let current = { ...payload };

  for (let i = 0; i < 6; i += 1) {
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

async function updateWithSchemaFallback(supabase, table, payload, id, ownerId) {
  let current = { ...payload };

  for (let i = 0; i < 6; i += 1) {
    const { data, error } = await supabase
      .from(table)
      .update(current)
      .eq("id", id)
      .eq("owner_id", ownerId)
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

function mapTransportRow(row) {
  if (!row) return null;
  return {
    _id: row.id,
    owner: row.owner_id,
    vehicleModel: row.vehicle_model,
    vehicleType: row.vehicle_type,
    plateNumber: row.plate_number,
    driverName: row.driver_name,
    contactNumber: row.contact_number,
    routeFrom: row.route_from,
    routeTo: row.route_to,
    availableDate: row.available_date || row.availableDate || null,
    fromCoords: row.from_coords || row.fromCoords || null,
    toCoords: row.to_coords || row.toCoords || null,
    driverOnline: row.driver_online ?? row.driverOnline ?? true,
    pricePerSeat: row.price_per_seat,
    seatsAvailable: row.seats_available,
    images: row.images || [],
    complianceDetails: row.compliance_details || row.complianceDetails || {},
    verificationDocuments: row.verification_documents || row.verificationDocuments || {},
    status: row.status,
    isVerified: row.is_verified,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function addTransport({ ownerId, payload }) {
  const supabase = getSupabaseClient();
  const insert = {
    owner_id: ownerId,
    vehicle_model: payload.vehicleModel,
    vehicle_type: payload.vehicleType,
    plate_number: payload.plateNumber,
    driver_name: payload.driverName,
    contact_number: payload.contactNumber,
    route_from: payload.routeFrom,
    route_to: payload.routeTo,
    available_date: payload.availableDate || null,
    from_coords: payload.fromCoords ? JSON.parse(payload.fromCoords) : null,
    to_coords: payload.toCoords ? JSON.parse(payload.toCoords) : null,
    driver_online: true,
    price_per_seat: Number(payload.pricePerSeat),
    seats_available: Number(payload.seatsAvailable),
    images: payload.images || [],
    compliance_details: payload.complianceDetails || {},
    verification_documents: payload.verificationDocuments || {},
    status: "pending",
    is_verified: false,
  };

  const { data, error } = await insertWithSchemaFallback(supabase, "transports", insert);

  if (error) throw new Error(error.message);
  return mapTransportRow(data);
}

async function getMyRides(ownerId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("transports")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapTransportRow);
}

function isMissingAvailableDateColumn(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("available_date") && message.includes("does not exist");
}

function applyBaseRideFilters(query, { from, to }) {
  let next = query
    .in("status", ["approved", "pending"])
    .gt("seats_available", 0);

  if (typeof from === "string") {
    next = next.ilike("route_from", `%${from}%`);
  }
  if (typeof to === "string") {
    next = next.ilike("route_to", `%${to}%`);
  }
  return next;
}

async function runRideListQuery({ date, from, to }) {
  const supabase = getSupabaseClient();
  let query = supabase.from("transports").select("*");
  query = applyBaseRideFilters(query, { from, to });

  if (date) {
    query = query.gte("available_date", `${date}T00:00:00.000Z`).lt("available_date", `${date}T23:59:59.999Z`);
  }

  query = query
    .order("available_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  let { data, error } = await query;
  if (!error) return { data, error: null };

  if (!isMissingAvailableDateColumn(error)) {
    return { data: null, error };
  }

  let fallbackQuery = supabase.from("transports").select("*");
  fallbackQuery = applyBaseRideFilters(fallbackQuery, { from, to });
  fallbackQuery = fallbackQuery.order("created_at", { ascending: false });
  const fallback = await fallbackQuery;
  return { data: fallback.data, error: fallback.error };
}

async function getRideById(id) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("transports")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return mapTransportRow(data);
}

async function updateTransport({ ownerId, id, updateFields }) {
  const supabase = getSupabaseClient();
  const safe = { ...updateFields };
  const restricted = new Set(["owner", "owner_id", "_id", "id", "status", "isVerified", "is_verified"]);
  for (const k of Object.keys(safe)) {
    if (restricted.has(k)) delete safe[k];
  }

  const patch = {};
  if (safe.vehicleModel !== undefined) patch.vehicle_model = safe.vehicleModel;
  if (safe.vehicleType !== undefined) patch.vehicle_type = safe.vehicleType;
  if (safe.plateNumber !== undefined) patch.plate_number = safe.plateNumber;
  if (safe.driverName !== undefined) patch.driver_name = safe.driverName;
  if (safe.contactNumber !== undefined) patch.contact_number = safe.contactNumber;
  if (safe.routeFrom !== undefined) patch.route_from = safe.routeFrom;
  if (safe.routeTo !== undefined) patch.route_to = safe.routeTo;
  if (safe.fromCoords !== undefined) patch.from_coords = safe.fromCoords;
  if (safe.toCoords !== undefined) patch.to_coords = safe.toCoords;
  if (safe.driverOnline !== undefined) patch.driver_online = Boolean(safe.driverOnline);
  if (safe.availableDate !== undefined) patch.available_date = safe.availableDate || null;
  if (safe.pricePerSeat !== undefined) patch.price_per_seat = Number(safe.pricePerSeat);
  if (safe.seatsAvailable !== undefined) patch.seats_available = Number(safe.seatsAvailable);
  if (safe.images !== undefined) patch.images = safe.images;
  if (safe.complianceDetails !== undefined) patch.compliance_details = safe.complianceDetails;
  if (safe.verificationDocuments !== undefined) patch.verification_documents = safe.verificationDocuments;

  const { data, error } = await updateWithSchemaFallback(supabase, "transports", patch, id, ownerId);

  if (error) throw new Error(error.message);
  return mapTransportRow(data);
}

async function listApprovedRides({ date }) {
  const { data, error } = await runRideListQuery({ date });
  if (error) throw new Error(error.message);
  return (data || []).map(mapTransportRow);
}

async function searchApprovedRides({ from, to, date }) {
  const { data, error } = await runRideListQuery({
    date,
    from: from || "",
    to: to || "",
  });
  if (error) throw new Error(error.message);
  return (data || []).map(mapTransportRow);
}

async function listAllRides() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("transports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapTransportRow);
}

module.exports = {
  addTransport,
  getRideById,
  getMyRides,
  updateTransport,
  mapTransportRow,
  listApprovedRides,
  searchApprovedRides,
  listAllRides,
};

