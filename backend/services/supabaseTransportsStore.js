const { getSupabaseClient } = require("../utils/supabaseClient");

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
    fromCoords: row.from_coords,
    toCoords: row.to_coords,
    pricePerSeat: row.price_per_seat,
    seatsAvailable: row.seats_available,
    images: row.images || [],
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
    from_coords: payload.fromCoords ? JSON.parse(payload.fromCoords) : null,
    to_coords: payload.toCoords ? JSON.parse(payload.toCoords) : null,
    price_per_seat: Number(payload.pricePerSeat),
    seats_available: Number(payload.seatsAvailable),
    images: payload.images || [],
    status: "pending",
    is_verified: false,
  };

  const { data, error } = await supabase
    .from("transports")
    .insert(insert)
    .select("*")
    .single();

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
  if (safe.pricePerSeat !== undefined) patch.price_per_seat = Number(safe.pricePerSeat);
  if (safe.seatsAvailable !== undefined) patch.seats_available = Number(safe.seatsAvailable);

  const { data, error } = await supabase
    .from("transports")
    .update(patch)
    .eq("id", id)
    .eq("owner_id", ownerId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapTransportRow(data);
}

module.exports = { addTransport, getMyRides, updateTransport, mapTransportRow };

