const { getSupabaseClient } = require("../utils/supabaseClient");
const supabaseTransports = require("./supabaseTransportsStore");

function mapSharedTaxiRow(row) {
  if (!row) return null;
  const totalSeats = Number(row.total_seats || 0);
  const bookedSeats = Number(row.booked_seats || 0);
  const seatsLeft = Math.max(totalSeats - bookedSeats, 0);

  return {
    _id: row.id,
    owner: row.owner_id,
    rideMode: "shared_taxi",
    serviceLabel: "Shared Taxi",
    vehicleModel: row.vehicle_model || "",
    vehicleType: row.vehicle_type || "Shared Taxi",
    plateNumber: row.plate_number || "",
    driverName: row.driver_name || "",
    contactNumber: row.contact_number || "",
    routeFrom: row.route_from || "",
    routeTo: row.route_to || "",
    availableDate: row.available_date || null,
    fromCoords: row.from_coords || null,
    toCoords: row.to_coords || null,
    pricePerSeat: Number(row.price_per_seat || 0),
    totalSeats,
    bookedSeats,
    seatsAvailable: seatsLeft,
    seatsLeft,
    driverOnline: row.driver_online ?? true,
    images: row.images || [],
    complianceDetails: row.compliance_details || {},
    verificationDocuments: row.verification_documents || {},
    status: row.status || "approved",
    isVerified: row.is_verified ?? true,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

function mapTaxiBookingRow(row) {
  if (!row) return null;
  return {
    _id: row.id,
    userId: row.user_id,
    driverId: row.driver_id || null,
    sourceTransportId: row.source_transport_id || null,
    customerName: row.customer_name || "",
    customerPhone: row.customer_phone || "",
    pickupLocation: row.pickup_location || "",
    dropLocation: row.drop_location || "",
    pickupCoords: row.pickup_coords || null,
    dropCoords: row.drop_coords || null,
    scheduledFor: row.scheduled_for || null,
    distanceKm: Number(row.distance_km || 0),
    estimatedFare: Number(row.estimated_fare || 0),
    status: row.status || "pending",
    assignmentMeta: row.assignment_meta || {},
    pricingMeta: row.pricing_meta || {},
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

function routeMatchScore(ride = {}, booking = {}) {
  const rideFrom = String(ride.routeFrom || "").trim().toLowerCase();
  const rideTo = String(ride.routeTo || "").trim().toLowerCase();
  const pickup = String(booking.pickupLocation || "").trim().toLowerCase();
  const drop = String(booking.dropLocation || "").trim().toLowerCase();
  let score = 0;
  if (pickup && rideFrom && (pickup.includes(rideFrom) || rideFrom.includes(pickup))) score += 3;
  if (drop && rideTo && (drop.includes(rideTo) || rideTo.includes(drop))) score += 3;
  if (pickup && rideTo && (pickup.includes(rideTo) || rideTo.includes(pickup))) score += 1;
  if (drop && rideFrom && (drop.includes(rideFrom) || rideFrom.includes(drop))) score += 1;
  return score;
}

function haversineDistanceKm(origin, destination) {
  const lat1 = Number(origin?.lat);
  const lng1 = Number(origin?.lng);
  const lat2 = Number(destination?.lat);
  const lng2 = Number(destination?.lng);
  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) return 0;

  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function inferTravelMinutes(distanceKm = 0) {
  const effectiveSpeedKmph = 32;
  return Math.max(18, Math.round((Number(distanceKm || 0) / effectiveSpeedKmph) * 60));
}

function buildFare(distanceKm = 0, rideDateTime = null) {
  const normalizedDistance = Math.max(Number(distanceKm || 0), 1);
  const baseFare = 220;
  const perKm = 28;
  const mountainSurcharge = normalizedDistance > 35 ? 180 : 90;
  const scheduled = rideDateTime ? new Date(rideDateTime) : null;
  const hour = scheduled && !Number.isNaN(scheduled.getTime()) ? scheduled.getHours() : 12;
  const timeBandSurcharge = hour < 6 || hour >= 21 ? 140 : 0;

  const fare = Math.round(baseFare + normalizedDistance * perKm + mountainSurcharge + timeBandSurcharge);
  return {
    baseFare,
    perKm,
    mountainSurcharge,
    timeBandSurcharge,
    totalFare: fare,
  };
}

async function getGoogleDistanceEstimate(origin, destination) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const hasCoords = [origin?.lat, origin?.lng, destination?.lat, destination?.lng].every((value) => Number.isFinite(Number(value)));
  if (!apiKey || !hasCoords) return null;

  const origins = `${Number(origin.lat)},${Number(origin.lng)}`;
  const destinations = `${Number(destination.lat)},${Number(destination.lng)}`;
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origins)}&destinations=${encodeURIComponent(destinations)}&mode=driving&units=metric&key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    const element = data?.rows?.[0]?.elements?.[0];
    if (!element || element.status !== "OK") return null;
    const meters = Number(element.distance?.value || 0);
    const seconds = Number(element.duration?.value || 0);
    if (!Number.isFinite(meters) || meters <= 0) return null;
    return {
      distanceKm: Number((meters / 1000).toFixed(1)),
      durationMinutes: seconds > 0 ? Math.max(1, Math.round(seconds / 60)) : null,
      source: "google_maps",
    };
  } catch {
    return null;
  }
}

async function estimateTaxiQuote({ pickupCoords, dropCoords, rideDateTime }) {
  const googleEstimate = await getGoogleDistanceEstimate(pickupCoords, dropCoords);
  const fallbackDistance = Number(haversineDistanceKm(pickupCoords, dropCoords).toFixed(1));
  const distanceKm = googleEstimate?.distanceKm || fallbackDistance;
  const durationMinutes = googleEstimate?.durationMinutes || inferTravelMinutes(distanceKm);
  const pricing = buildFare(distanceKm, rideDateTime);

  return {
    distanceKm,
    durationMinutes,
    estimatedFare: pricing.totalFare,
    pricing,
    source: googleEstimate?.source || "haversine",
  };
}

async function listPublicSharedTaxiRides({ from = "", to = "", date = "" } = {}) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("shared_taxi_rides")
    .select("*")
    .eq("status", "approved")
    .eq("driver_online", true)
    .order("available_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (from) query = query.ilike("route_from", `%${from}%`);
  if (to) query = query.ilike("route_to", `%${to}%`);
  if (date) {
    query = query.gte("available_date", `${date}T00:00:00.000Z`).lt("available_date", `${date}T23:59:59.999Z`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || [])
    .map(mapSharedTaxiRow)
    .filter((item) => Number(item.seatsLeft || 0) > 0);
}

async function getSharedTaxiRideById(id) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("shared_taxi_rides").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return mapSharedTaxiRow(data);
}

async function getMySharedTaxiRides(ownerId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("shared_taxi_rides")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapSharedTaxiRow);
}

async function createSharedTaxiRide({ ownerId, payload }) {
  const supabase = getSupabaseClient();
  const row = {
    owner_id: ownerId,
    vehicle_model: payload.vehicleModel || "",
    vehicle_type: payload.vehicleType || "Shared Taxi",
    plate_number: payload.plateNumber || "",
    driver_name: payload.driverName || "",
    contact_number: payload.contactNumber || "",
    route_from: payload.routeFrom || "",
    route_to: payload.routeTo || "",
    available_date: payload.availableDate || null,
    from_coords: payload.fromCoords ? JSON.parse(payload.fromCoords) : null,
    to_coords: payload.toCoords ? JSON.parse(payload.toCoords) : null,
    price_per_seat: Number(payload.pricePerSeat || 0),
    total_seats: Math.max(1, Number(payload.seatsAvailable || payload.totalSeats || 1)),
    booked_seats: 0,
    driver_online: true,
    images: payload.images || [],
    compliance_details: payload.complianceDetails || {},
    verification_documents: payload.verificationDocuments || {},
    status: "approved",
    is_verified: true,
  };

  const { data, error } = await supabase.from("shared_taxi_rides").insert(row).select("*").single();
  if (error) throw new Error(error.message);
  return mapSharedTaxiRow(data);
}

async function updateSharedTaxiRide({ ownerId, id, updateFields }) {
  const supabase = getSupabaseClient();
  const patch = {};
  if (updateFields.vehicleModel !== undefined) patch.vehicle_model = updateFields.vehicleModel;
  if (updateFields.vehicleType !== undefined) patch.vehicle_type = updateFields.vehicleType;
  if (updateFields.plateNumber !== undefined) patch.plate_number = updateFields.plateNumber;
  if (updateFields.driverName !== undefined) patch.driver_name = updateFields.driverName;
  if (updateFields.contactNumber !== undefined) patch.contact_number = updateFields.contactNumber;
  if (updateFields.routeFrom !== undefined) patch.route_from = updateFields.routeFrom;
  if (updateFields.routeTo !== undefined) patch.route_to = updateFields.routeTo;
  if (updateFields.availableDate !== undefined) patch.available_date = updateFields.availableDate || null;
  if (updateFields.fromCoords !== undefined) patch.from_coords = updateFields.fromCoords;
  if (updateFields.toCoords !== undefined) patch.to_coords = updateFields.toCoords;
  if (updateFields.pricePerSeat !== undefined) patch.price_per_seat = Number(updateFields.pricePerSeat || 0);
  if (updateFields.seatsAvailable !== undefined || updateFields.totalSeats !== undefined) {
    patch.total_seats = Math.max(1, Number(updateFields.totalSeats || updateFields.seatsAvailable || 1));
  }
  if (updateFields.driverOnline !== undefined) patch.driver_online = Boolean(updateFields.driverOnline);
  if (updateFields.images !== undefined) patch.images = updateFields.images;
  if (updateFields.complianceDetails !== undefined) patch.compliance_details = updateFields.complianceDetails;
  if (updateFields.verificationDocuments !== undefined) patch.verification_documents = updateFields.verificationDocuments;

  const { data, error } = await supabase
    .from("shared_taxi_rides")
    .update(patch)
    .eq("id", id)
    .eq("owner_id", ownerId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapSharedTaxiRow(data);
}

async function reserveSharedTaxiSeats({ rideId, seats }) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("reserve_shared_taxi_seats", {
    p_ride_id: rideId,
    p_requested_seats: Math.max(1, Number(seats || 1)),
  });
  if (error) throw new Error(error.message);
  return data || { success: true };
}

async function releaseSharedTaxiSeats({ rideId, seats }) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("release_shared_taxi_seats", {
    p_ride_id: rideId,
    p_released_seats: Math.max(1, Number(seats || 1)),
  });
  if (error) throw new Error(error.message);
  return data || { success: true };
}

async function findAssignableDriver({ pickupLocation = "", dropLocation = "" } = {}) {
  const rides = await supabaseTransports.listAllRides();
  const normalizedPickup = String(pickupLocation || "").trim().toLowerCase();
  const normalizedDrop = String(dropLocation || "").trim().toLowerCase();

  const candidates = rides.filter((ride) => {
    const approved = String(ride.status || "").toLowerCase() === "approved";
    const online = ride.driverOnline !== false;
    return approved && online;
  });

  const scored = candidates
    .map((ride) => {
      let score = 0;
      if (normalizedPickup && String(ride.routeFrom || "").toLowerCase().includes(normalizedPickup)) score += 3;
      if (normalizedDrop && String(ride.routeTo || "").toLowerCase().includes(normalizedDrop)) score += 3;
      if (String(ride.vehicleType || "").toLowerCase().includes("taxi")) score += 1;
      if (String(ride.vehicleType || "").toLowerCase().includes("suv")) score += 1;
      return { ride, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.ride || candidates[0] || null;
}

async function findDriverRideForOwner(ownerId, booking = null) {
  const rides = await supabaseTransports.getMyRides(ownerId);
  const candidates = rides.filter((ride) => ride.driverOnline !== false);
  if (!booking) return candidates[0] || rides[0] || null;

  const ranked = candidates
    .map((ride) => ({ ride, score: routeMatchScore(ride, booking) }))
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.ride || candidates[0] || rides[0] || null;
}

async function createTaxiBooking({ userId, payload }) {
  const supabase = getSupabaseClient();
  const assignment = await findAssignableDriver({
    pickupLocation: payload.pickupLocation,
    dropLocation: payload.dropLocation,
  });

  const status = assignment ? "confirmed" : "pending";
  const row = {
    user_id: userId,
    driver_id: assignment?.owner || null,
    source_transport_id: assignment?._id || null,
    customer_name: payload.customerName || "",
    customer_phone: payload.customerPhone || "",
    pickup_location: payload.pickupLocation || "",
    drop_location: payload.dropLocation || "",
    pickup_coords: payload.pickupCoords || null,
    drop_coords: payload.dropCoords || null,
    scheduled_for: payload.scheduledFor,
    distance_km: Number(payload.distanceKm || 0),
    estimated_fare: Number(payload.estimatedFare || 0),
    status,
    assignment_meta: assignment
      ? {
          driverName: assignment.driverName || "",
          driverPhone: assignment.contactNumber || "",
          vehicleType: assignment.vehicleType || "",
          vehicleModel: assignment.vehicleModel || "",
          plateNumber: assignment.plateNumber || "",
        }
      : {},
    pricing_meta: payload.pricingMeta || {},
  };

  const { data, error } = await supabase.from("taxi_bookings").insert(row).select("*").single();
  if (error) throw new Error(error.message);
  return mapTaxiBookingRow(data);
}

async function listTaxiBookingsByUserId(userId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("taxi_bookings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapTaxiBookingRow);
}

async function listTaxiBookingsByDriverId(driverId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("taxi_bookings")
    .select("*")
    .eq("driver_id", driverId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapTaxiBookingRow);
}

async function listTaxiBookingsForDriverInbox(driverId) {
  const supabase = getSupabaseClient();
  const [assigned, myRides] = await Promise.all([
    listTaxiBookingsByDriverId(driverId),
    supabaseTransports.getMyRides(driverId).catch(() => []),
  ]);

  const hasDriverInventory = (myRides || []).some((ride) => ride.driverOnline !== false);
  if (!hasDriverInventory) return assigned;

  const { data, error } = await supabase
    .from("taxi_bookings")
    .select("*")
    .is("driver_id", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const discoverable = (data || [])
    .map(mapTaxiBookingRow)
    .map((booking) => ({
      booking,
      score: Math.max(...myRides.map((ride) => routeMatchScore(ride, booking)), 0),
    }))
    .filter((entry) => entry.score > 0 || myRides.length > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.booking);

  const merged = [...assigned, ...discoverable];
  const seen = new Set();
  return merged.filter((item) => {
    if (seen.has(item._id)) return false;
    seen.add(item._id);
    return true;
  });
}

async function updateTaxiBookingStatus({ bookingId, driverId, status }) {
  const supabase = getSupabaseClient();
  const normalized = String(status || "").trim().toLowerCase();
  if (!["confirmed", "declined"].includes(normalized)) {
    throw new Error("Invalid taxi booking action.");
  }

  const { data: currentRow, error: currentError } = await supabase
    .from("taxi_bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle();

  if (currentError) throw new Error(currentError.message);
  const current = mapTaxiBookingRow(currentRow);
  if (!current) throw new Error("Taxi booking not found.");

  if (current.driverId && String(current.driverId) !== String(driverId)) {
    throw new Error("This taxi booking is assigned to another driver.");
  }

  const assignedRide = await findDriverRideForOwner(driverId, current);
  if (!assignedRide) {
    throw new Error("You need at least one live ride profile to accept taxi requests.");
  }

  const patch = {
    status: normalized,
    driver_id: driverId,
    source_transport_id: assignedRide?._id || current.sourceTransportId || null,
    assignment_meta:
      normalized === "confirmed"
        ? {
            driverName: assignedRide.driverName || "",
            driverPhone: assignedRide.contactNumber || "",
            vehicleType: assignedRide.vehicleType || "",
            vehicleModel: assignedRide.vehicleModel || "",
            plateNumber: assignedRide.plateNumber || "",
          }
        : current.assignmentMeta || {},
  };

  const { data, error } = await supabase
    .from("taxi_bookings")
    .update(patch)
    .eq("id", bookingId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapTaxiBookingRow(data);
}

module.exports = {
  mapSharedTaxiRow,
  mapTaxiBookingRow,
  estimateTaxiQuote,
  listPublicSharedTaxiRides,
  getSharedTaxiRideById,
  getMySharedTaxiRides,
  createSharedTaxiRide,
  updateSharedTaxiRide,
  reserveSharedTaxiSeats,
  releaseSharedTaxiSeats,
  createTaxiBooking,
  listTaxiBookingsByUserId,
  listTaxiBookingsByDriverId,
  listTaxiBookingsForDriverInbox,
  updateTaxiBookingStatus,
};
