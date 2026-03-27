const { getSupabaseClient } = require("../utils/supabaseClient");

function mapHotelRow(row) {
  if (!row) return null;
  return {
    _id: row.id, // keep frontend compatibility
    hotelName: row.hotel_name,
    location: row.location,
    pricePerNight: row.price_per_night,
    roomsAvailable: row.rooms_available,
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
    location: payload.location,
    price_per_night: Number(payload.pricePerNight),
    rooms_available: Number(payload.roomsAvailable) || 10,
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

  const { data, error } = await supabase
    .from("hotels")
    .insert(insert)
    .select("*")
    .single();

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

async function updateHotel({ ownerId, id, updateData }) {
  const supabase = getSupabaseClient();

  // Restricted fields
  const restricted = new Set(["hotelName", "owner", "owner_id", "isVerified", "status", "_id", "id"]);
  const safe = { ...updateData };
  for (const k of Object.keys(safe)) {
    if (restricted.has(k)) delete safe[k];
  }

  const patch = {};
  if (safe.location !== undefined) patch.location = safe.location;
  if (safe.contactNumber !== undefined) patch.contact_number = safe.contactNumber;
  if (safe.description !== undefined) patch.description = safe.description;
  if (safe.distance !== undefined) patch.distance = safe.distance;
  if (safe.pricePerNight !== undefined) patch.price_per_night = Number(safe.pricePerNight);
  if (safe.roomsAvailable !== undefined) patch.rooms_available = Number(safe.roomsAvailable);
  if (safe.complianceDetails !== undefined) patch.compliance_details = safe.complianceDetails;
  if (safe.verificationDocuments !== undefined) patch.verification_documents = safe.verificationDocuments;

  const { data, error } = await supabase
    .from("hotels")
    .update(patch)
    .eq("id", id)
    .eq("owner_id", ownerId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapHotelRow(data);
}

module.exports = { addHotel, getMyHotels, updateHotel, mapHotelRow };

