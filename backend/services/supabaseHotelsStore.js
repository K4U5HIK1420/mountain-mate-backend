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

function mapHotelRow(row) {
  if (!row) return null;
  return {
    _id: row.id, // keep frontend compatibility
    hotelName: row.hotel_name,
    propertyType: row.property_type || row.propertyType || "Hotel",
    location: row.location,
    landmark: row.landmark || "",
    ownerName: row.owner_name || row.ownerName || "",
    pricePerNight: row.price_per_night,
    roomsAvailable: row.rooms_available,
    guestsPerRoom: row.guests_per_room || row.guestsPerRoom || 2,
    availabilityStatus: row.availability_status || row.availabilityStatus || "Available now",
    contactNumber: row.contact_number,
    description: row.description,
    distance: row.distance,
    images: row.images || [],
    amenities: JSON.stringify(row.amenities ?? []),
    complianceDetails: row.compliance_details || {},
    verificationDocuments: row.verification_documents || {},
    owner: row.owner_id,
    status: row.status,
    isVerified: row.is_verified,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function addHotel({ ownerId, payload }) {
  const supabase = getSupabaseClient();

  const insert = {
    owner_id: ownerId,
    hotel_name: payload.hotelName,
    property_type: payload.propertyType || "Hotel",
    location: payload.location,
    landmark: payload.landmark || "",
    owner_name: payload.ownerName || "",
    price_per_night: Number(payload.pricePerNight),
    rooms_available: Number(payload.roomsAvailable) || 10,
    guests_per_room: Number(payload.guestsPerRoom) || 2,
    availability_status: payload.availabilityStatus || "Available now",
    contact_number: payload.contactNumber || "9999999999",
    description: payload.description || "",
    distance: payload.distance || "0",
    images: payload.images || [],
    amenities: payload.amenities ? JSON.parse(payload.amenities) : [],
    compliance_details: payload.complianceDetails || {},
    verification_documents: payload.verificationDocuments || {},
    status: "pending",
    is_verified: false,
  };

  const { data, error } = await insertWithSchemaFallback(supabase, "hotels", insert);

  if (error) throw new Error(error.message);
  return mapHotelRow(data);
}

async function getMyHotels(ownerId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("hotels")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapHotelRow);
}

async function getHotelById(id) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("hotels")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return mapHotelRow(data);
}

async function updateHotel({ ownerId, id, updateData }) {
  const supabase = getSupabaseClient();

  // Restricted fields
  const restricted = new Set(["hotelName", "owner", "owner_id", "isVerified", "status", "_id", "id"]);
  const safe = { ...updateData };
  for (const k of Object.keys(safe)) {
    if (restricted.has(k)) delete safe[k];
  }

  const patch = {};
  if (safe.propertyType !== undefined) patch.property_type = safe.propertyType;
  if (safe.location !== undefined) patch.location = safe.location;
  if (safe.landmark !== undefined) patch.landmark = safe.landmark;
  if (safe.ownerName !== undefined) patch.owner_name = safe.ownerName;
  if (safe.contactNumber !== undefined) patch.contact_number = safe.contactNumber;
  if (safe.description !== undefined) patch.description = safe.description;
  if (safe.distance !== undefined) patch.distance = safe.distance;
  if (safe.pricePerNight !== undefined) patch.price_per_night = Number(safe.pricePerNight);
  if (safe.roomsAvailable !== undefined) patch.rooms_available = Number(safe.roomsAvailable);
  if (safe.guestsPerRoom !== undefined) patch.guests_per_room = Number(safe.guestsPerRoom);
  if (safe.availabilityStatus !== undefined) patch.availability_status = safe.availabilityStatus;
  if (safe.images !== undefined) patch.images = safe.images;
  if (safe.amenities !== undefined) {
    patch.amenities = Array.isArray(safe.amenities)
      ? safe.amenities
      : typeof safe.amenities === "string"
        ? JSON.parse(safe.amenities || "[]")
        : [];
  }
  if (safe.complianceDetails !== undefined) patch.compliance_details = safe.complianceDetails;
  if (safe.verificationDocuments !== undefined) patch.verification_documents = safe.verificationDocuments;

  const { data, error } = await updateWithSchemaFallback(supabase, "hotels", patch, id, ownerId);

  if (error) throw new Error(error.message);
  return mapHotelRow(data);
}

async function listAllHotels() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("hotels")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapHotelRow);
}

async function listApprovedHotels() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("hotels")
    .select("*")
    .eq("is_verified", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapHotelRow);
}

async function searchApprovedHotels({ location = "", minPrice, maxPrice, sort }) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("hotels")
    .select("*")
    .eq("is_verified", true);

  if (location) {
    query = query.ilike("location", `%${location}%`);
  }

  if (minPrice) {
    query = query.gte("price_per_night", Number(minPrice));
  }

  if (maxPrice) {
    query = query.lte("price_per_night", Number(maxPrice));
  }

  if (sort === "price_asc") {
    query = query.order("price_per_night", { ascending: true });
  } else if (sort === "price_desc") {
    query = query.order("price_per_night", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return (data || []).map(mapHotelRow);
}

module.exports = {
  addHotel,
  getHotelById,
  getMyHotels,
  updateHotel,
  listAllHotels,
  listApprovedHotels,
  searchApprovedHotels,
  mapHotelRow,
};

