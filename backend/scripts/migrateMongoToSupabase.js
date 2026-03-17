// Migrates MongoDB hotels/transports into Supabase Postgres tables.
// Prereqs:
// - Supabase SQL schema applied (see /supabase/schema.sql)
// - backend/.env contains MONGO_URI, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Usage:
//   node scripts/migrateMongoToSupabase.js

require("dotenv").config();
const mongoose = require("mongoose");
const Hotel = require("../models/Hotel");
const Transport = require("../models/Transport");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const { getSupabaseClient } = require("../utils/supabaseClient");

async function migrateHotels(supabase) {
  const hotels = await Hotel.find().sort({ createdAt: 1 }).lean();
  let ok = 0;
  let fail = 0;

  for (const h of hotels) {
    // Skip legacy ObjectId owners that aren't Supabase users
    if (!h.owner || typeof h.owner !== "string") continue;

    const insert = {
      owner_id: h.owner,
      hotel_name: h.hotelName,
      location: h.location,
      price_per_night: Number(h.pricePerNight),
      rooms_available: Number(h.roomsAvailable),
      contact_number: h.contactNumber,
      description: h.description || "",
      distance: h.distance || "0",
      images: h.images || [],
      amenities: h.amenities ? JSON.parse(h.amenities) : [],
      status: h.status || "pending",
      is_verified: !!h.isVerified,
      created_at: h.createdAt,
      updated_at: h.updatedAt,
    };

    const { error } = await supabase.from("hotels").insert(insert);
    if (error) {
      fail++;
      // eslint-disable-next-line no-console
      console.error("Hotel migrate failed:", h._id, error.message);
    } else {
      ok++;
    }
  }

  return { ok, fail };
}

async function migrateTransports(supabase) {
  const rides = await Transport.find().sort({ createdAt: 1 }).lean();
  let ok = 0;
  let fail = 0;

  for (const r of rides) {
    if (!r.owner || typeof r.owner !== "string") continue;

    const insert = {
      owner_id: r.owner,
      vehicle_model: r.vehicleModel,
      vehicle_type: r.vehicleType,
      plate_number: r.plateNumber,
      driver_name: r.driverName,
      contact_number: r.contactNumber,
      route_from: r.routeFrom,
      route_to: r.routeTo,
      from_coords: r.fromCoords || null,
      to_coords: r.toCoords || null,
      price_per_seat: Number(r.pricePerSeat),
      seats_available: Number(r.seatsAvailable),
      images: r.images || [],
      status: r.status || "pending",
      is_verified: !!r.isVerified,
      created_at: r.createdAt,
      updated_at: r.updatedAt,
    };

    const { error } = await supabase
      .from("transports")
      .upsert(insert, { onConflict: "plate_number" });
    if (error) {
      fail++;
      // eslint-disable-next-line no-console
      console.error("Transport migrate failed:", r._id, error.message);
    } else {
      ok++;
    }
  }

  return { ok, fail };
}

async function migrateBookings(supabase) {
  const bookings = await Booking.find().sort({ createdAt: 1 }).lean();
  let ok = 0;
  let fail = 0;

  for (const b of bookings) {
    const insert = {
      customer_name: b.customerName,
      phone_number: b.phoneNumber,
      booking_type: b.bookingType,
      listing_mongo_id: b.listingId ? String(b.listingId) : null,
      listing_supabase_id: null,
      date: b.date ? new Date(b.date).toISOString().slice(0, 10) : null,
      status: b.status || "pending",
      payment_id: b.paymentId || null,
      order_id: b.orderId || null,
      payment_status: b.paymentStatus || "pending",
      created_at: b.createdAt,
      updated_at: b.updatedAt,
    };

    const { error } = await supabase.from("bookings").insert(insert);
    if (error) {
      fail++;
      // eslint-disable-next-line no-console
      console.error("Booking migrate failed:", b._id, error.message);
    } else {
      ok++;
    }
  }

  return { ok, fail };
}

async function migrateReviews(supabase) {
  const reviews = await Review.find().sort({ createdAt: 1 }).lean();
  let ok = 0;
  let fail = 0;

  for (const r of reviews) {
    const insert = {
      hotel_mongo_id: r.hotelId ? String(r.hotelId) : null,
      hotel_supabase_id: null,
      customer_name: r.customerName,
      rating: Number(r.rating),
      comment: r.comment,
      created_at: r.createdAt,
      updated_at: r.updatedAt,
    };

    const { error } = await supabase.from("reviews").insert(insert);
    if (error) {
      fail++;
      // eslint-disable-next-line no-console
      console.error("Review migrate failed:", r._id, error.message);
    } else {
      ok++;
    }
  }

  return { ok, fail };
}

async function main() {
  const supabase = getSupabaseClient();

  if (!process.env.MONGO_URI) throw new Error("MONGO_URI missing");

  await mongoose.connect(process.env.MONGO_URI);

  // eslint-disable-next-line no-console
  console.log("Connected to Mongo");

  const hotelsRes = await migrateHotels(supabase);
  const ridesRes = await migrateTransports(supabase);
  const bookingsRes = await migrateBookings(supabase);
  const reviewsRes = await migrateReviews(supabase);

  // eslint-disable-next-line no-console
  console.log("Hotels migrated:", hotelsRes);
  // eslint-disable-next-line no-console
  console.log("Transports migrated:", ridesRes);
  // eslint-disable-next-line no-console
  console.log("Bookings migrated:", bookingsRes);
  // eslint-disable-next-line no-console
  console.log("Reviews migrated:", reviewsRes);

  await mongoose.disconnect();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

