const mongoose = require("mongoose");
const fs = require("fs");
const User = require("../models/User");
const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const Transport = require("../models/Transport");
const Review = require("../models/Review");
const cloudinary = require("../config/cloudinary");
const { restoreBookingInventory } = require("../utils/bookingInventory");
const { createNotification } = require("../services/notificationService");
const { resolveAppUser } = require("../utils/resolveAppUser");
const { getDataStore } = require("../utils/dataStore");
const { getSupabaseClient } = require("../utils/supabaseClient");
const supabaseBookings = require("../services/supabaseBookingsStore");
const supabaseHotels = require("../services/supabaseHotelsStore");
const supabaseTransports = require("../services/supabaseTransportsStore");

function canUseMongoModels() {
  return mongoose.connection.readyState === 1;
}

async function uploadAvatar(file) {
  if (!file?.path) return "";
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "mountain_mate/avatars",
      resource_type: "image",
    });
    return result.secure_url || "";
  } finally {
    if (file?.path) {
      fs.unlink(file.path, () => {});
    }
  }
}

async function resolveListingContact(booking, isSupabase) {
  if (!booking) return null;

  try {
    if (isSupabase) {
      return booking.bookingType === "Hotel"
        ? await supabaseHotels.getHotelById(String(booking.listingId || ""))
        : await supabaseTransports.getRideById(String(booking.listingId || ""));
    }

    if (booking.listingId && typeof booking.listingId === "object") {
      return booking.listingId;
    }

    const ListingModel = booking.bookingType === "Hotel" ? Hotel : Transport;
    return await ListingModel.findById(booking.listingId).lean();
  } catch (_err) {
    return null;
  }
}

async function attachCounterpartyDetails(bookings = [], { viewerRole = "user", isSupabase = false } = {}) {
  return Promise.all(
    bookings.map(async (booking) => {
      if (!booking) return booking;

      if (viewerRole === "partner") {
        return {
          ...booking,
          counterpartyName: booking.customerName || "Customer",
          counterpartyPhone: booking.phoneNumber || "",
          counterpartyRole: "customer",
        };
      }

      const listing = await resolveListingContact(booking, isSupabase);
      const isRide = booking.bookingType === "Transport";
      const counterpartyPhone = String(listing?.contactNumber || "").trim();
      const counterpartyName = isRide
        ? String(listing?.driverName || "Driver").trim()
        : String(listing?.hotelName || "Hotel host").trim();

      return {
        ...booking,
        counterpartyName,
        counterpartyPhone,
        counterpartyRole: isRide ? "driver" : "host",
      };
    })
  );
}

// --- 🏔️ PROFILE SETUP ---
exports.setupProfile = async (req, res) => {
  try {
    const { fullName, phone, avatarUrl } = req.body;
    const supabaseUser = req.user;
    const trimmedFullName = String(fullName || "").trim();
    const trimmedPhone = String(phone || "").trim();
    const uploadedAvatarUrl = await uploadAvatar(req.file);
    const nextAvatarUrl = uploadedAvatarUrl || String(avatarUrl || "").trim();
    let nextUserMetadata = {
      ...(supabaseUser?.user_metadata || {}),
    };

    if (req.authType === "supabase" && supabaseUser?.id) {
      if (trimmedFullName) {
        nextUserMetadata.full_name = trimmedFullName;
        nextUserMetadata.display_name = trimmedFullName;
      }

      if (trimmedPhone) {
        nextUserMetadata.phone = trimmedPhone;
      }

      if (nextAvatarUrl) {
        nextUserMetadata.avatar_url = nextAvatarUrl;
      }

      try {
        const supabase = getSupabaseClient();
        await supabase.auth.admin.updateUserById(supabaseUser.id, {
          user_metadata: nextUserMetadata,
        });
      } catch (supabaseErr) {
        console.error("Supabase profile sync error:", supabaseErr.message);
      }
    }

    if (!canUseMongoModels()) {
      return res.json({
        success: true,
        message: "Profile synchronized",
        data: {
          name: trimmedFullName || nextUserMetadata.full_name || nextUserMetadata.display_name || "",
          phone: trimmedPhone || nextUserMetadata.phone || "",
          avatarUrl: nextAvatarUrl || nextUserMetadata.avatar_url || "",
          email: supabaseUser?.email || "",
        },
      });
    }

    let user = await User.findOne({ email: supabaseUser.email });

    if (user) {
      user.name = trimmedFullName || user.name;
      user.phone = trimmedPhone || user.phone;
      user.avatarUrl = nextAvatarUrl || user.avatarUrl;
      await user.save();
    } else {
      user = await User.create({
        email: supabaseUser.email,
        name: trimmedFullName || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split("@")[0] || "Traveler",
        phone: trimmedPhone,
        avatarUrl: nextAvatarUrl,
        referrals: {
          code: `MM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          invitedUsers: [],
          credits: 0
        }
      });
    }
    res.json({
      success: true,
      message: "Profile synchronized",
      data: {
        name: user.name || trimmedFullName || "",
        phone: user.phone || trimmedPhone || "",
        avatarUrl: user.avatarUrl || nextAvatarUrl || "",
        email: user.email || supabaseUser.email || "",
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Profile sync failed" });
  }
};

// --- 🏔️ BOOKINGS LOGIC (USER + PARTNER ROLE BASED) ---

// 1. User View: Mene kahan booking ki hai?
exports.getMyBookings = async (req, res) => {
  try {
    const ownerId = String(req.user?.id || req.user?._id || "");
    const isSupabase = getDataStore() === "supabase";
    const data = isSupabase
      ? await supabaseBookings.listBookingsByUserId(ownerId)
      : await Booking.find({ userId: ownerId })
          .sort({ createdAt: -1 })
          .populate("listingId")
          .lean();

    const bookingIds = data.map((item) => item._id);
    const canReadMongoReviews = mongoose.connection.readyState === 1;
    let reviews = [];

    if (bookingIds.length && canReadMongoReviews) {
      try {
        reviews = await Review.find({ bookingId: { $in: bookingIds } }).select("bookingId").lean();
      } catch (_reviewReadErr) {
        reviews = [];
      }
    }
    const reviewedBookingIds = new Set(reviews.map((item) => String(item.bookingId)));

    const enriched = data.map((booking) => {
      const stayCheckoutPassed =
        booking.bookingType === "Hotel" &&
        booking.endDate &&
        new Date(booking.endDate).getTime() <= Date.now();

      const canReview =
        booking.paymentStatus === "paid" &&
        !reviewedBookingIds.has(String(booking._id)) &&
        (
          (booking.bookingType === "Transport" && booking.status === "completed") ||
          (booking.bookingType === "Hotel" && (booking.status === "completed" || stayCheckoutPassed))
        );

      return {
        ...booking,
        hasReview: reviewedBookingIds.has(String(booking._id)),
        canReview,
      };
    });

    const withCounterparty = await attachCounterpartyDetails(enriched, {
      viewerRole: "user",
      isSupabase,
    });

    res.json({ success: true, data: withCounterparty || [] });
  } catch (err) { 
    res.status(500).json({ success: false, message: "Failed to fetch your expeditions" }); 
  }
};

// 2. Partner View: Mere hotel/ride pe kisne booking ki hai?
exports.getPartnerIncomingBookings = async (req, res) => {
  try {
    const ownerId = String(req.user?.id || req.user?._id || "");
    const isSupabase = getDataStore() === "supabase";
    const incoming =
      isSupabase
        ? await supabaseBookings.listBookingsByOwnerId(ownerId)
        : await Booking.find({ ownerId })
            .populate("listingId")
            .sort({ createdAt: -1 })
            .lean();

    const withCounterparty = await attachCounterpartyDetails(incoming || [], {
      viewerRole: "partner",
      isSupabase,
    });

    res.json({ success: true, data: withCounterparty || [] });
  } catch (err) {
    console.error("Partner Booking Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch incoming requests" });
  }
};

// 3. Action: Partner booking confirm/cancel karega
exports.updateBookingStatus = async (req, res) => {
  try {
    const { bookingId, status } = req.body;
    const normalizedStatus = String(status || "").toLowerCase();
    if (!["confirmed", "declined"].includes(normalizedStatus)) {
      return res.status(400).json({ success: false, message: "Invalid booking action" });
    }
    
    const isSupabase = getDataStore() === "supabase";
    const booking = isSupabase
      ? await supabaseBookings.getBookingById(String(bookingId))
      : await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    const actorId = String(req.user?.id || req.user?._id || "");
    let resolvedOwnerId = String(booking.ownerId || "");

    if (!resolvedOwnerId || resolvedOwnerId !== actorId) {
      try {
        const listing = isSupabase
          ? (
              booking.bookingType === "Hotel"
                ? await supabaseHotels.getHotelById(String(booking.listingId))
                : await supabaseTransports.getRideById(String(booking.listingId))
            )
          : await (booking.bookingType === "Hotel" ? Hotel : Transport)
              .findById(booking.listingId)
              .select("owner")
              .lean();
        resolvedOwnerId = String(listing?.owner || resolvedOwnerId || "");
        if (!isSupabase && resolvedOwnerId && String(booking.ownerId || "") !== resolvedOwnerId) {
          booking.ownerId = resolvedOwnerId;
        }
      } catch (_ownerSyncErr) {
        // Keep using the booking's stored ownerId if the legacy listing lookup fails.
      }
    }

    if (!resolvedOwnerId || resolvedOwnerId !== actorId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (booking.status === normalizedStatus) {
      return res.json({ success: true, message: `Booking already ${normalizedStatus}`, data: booking });
    }

    if (normalizedStatus === "declined" && booking.paymentStatus === "paid") {
      await restoreBookingInventory(booking);
    }

    const nextLiveTracking =
      booking.bookingType === "Transport"
        ? {
            ...(booking.liveTracking || {}),
            status: normalizedStatus === "confirmed" ? "accepted" : "searching",
          }
        : booking.liveTracking;

    let updatedBooking = booking;
    if (isSupabase) {
      updatedBooking = await supabaseBookings.updateBookingById(String(bookingId), {
        status: normalizedStatus,
        liveTracking: nextLiveTracking,
      });
    } else {
      booking.status = normalizedStatus;
      if (booking.bookingType === "Transport") {
        booking.liveTracking = nextLiveTracking;
      }
      await booking.save();
      updatedBooking = booking;
    }

    try {
      await createNotification(
        {
          userId: booking.userId,
          title: normalizedStatus === "confirmed" ? "Booking confirmed" : "Booking declined",
          message:
            normalizedStatus === "confirmed"
              ? `Your booking for ${updatedBooking.listingLabel || "the selected listing"} has been confirmed.`
              : `Your booking for ${updatedBooking.listingLabel || "the selected listing"} was declined by the owner or driver.`,
          type: normalizedStatus === "confirmed" ? "booking_confirmed" : "booking_declined",
          data: { bookingId: String(updatedBooking._id), bookingType: updatedBooking.bookingType },
        },
        req.app.get("io")
      );
    } catch (_notificationErr) {
      // Don't fail the booking update if notification delivery has an issue.
    }

    res.json({ success: true, message: `Booking status updated to ${normalizedStatus}`, data: updatedBooking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Status update failed" });
  }
};

// --- 🏔️ REFERRAL SYSTEM ---
exports.getReferralStats = async (req, res) => {
  try {
    const user = await resolveAppUser(req);
    if (!user) return res.status(404).json({ success: false, message: "Explorer not found" });

    res.json({
      success: true,
      data: {
        code: user.referrals?.code || "MM-UPDATING",
        referralCount: user.referrals?.invitedUsers?.length || 0,
        credits: user.referrals?.credits || 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Uplink Error" });
  }
};

exports.redeemCode = async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ success: false, message: "Code required" });

  try {
    const currentUser = await resolveAppUser(req);
    const inputCode = code.trim().toUpperCase();

    if (!currentUser.referrals) currentUser.referrals = { invitedUsers: [], credits: 0, hasRedeemed: false };
    if (currentUser.referrals.hasRedeemed) return res.status(400).json({ success: false, message: "Already redeemed!" });
    if (currentUser.referrals.code === inputCode) return res.status(400).json({ success: false, message: "Self-redeem not allowed" });

    const referrer = await User.findOne({ "referrals.code": inputCode });
    if (!referrer) return res.status(404).json({ success: false, message: "Invalid code" });

    currentUser.referrals.credits += 100;
    currentUser.referrals.hasRedeemed = true;
    
    if (!referrer.referrals) referrer.referrals = { invitedUsers: [], credits: 0 };
    referrer.referrals.credits += 50;
    referrer.referrals.invitedUsers.addToSet(currentUser._id);

    await Promise.all([currentUser.save(), referrer.save()]);
    res.json({ success: true, message: "Credits added successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Redemption Failed" });
  }
};

// --- 🏔️ WISHLIST LOGIC ---
exports.getWishlist = async (req, res) => {
  try {
    const user = await resolveAppUser(req);
    res.json({ success: true, wishlist: user?.wishlist || [] });
  } catch (err) { res.status(500).json({ success: false, message: "Wishlist fetch failed" }); }
};

exports.getWishlistItems = async (req, res) => {
  try {
    const user = await resolveAppUser(req);
    const wishlist = user?.wishlist || [];
    if (wishlist.length === 0) return res.json({ success: true, data: [] });

    const hotelIds = wishlist.filter(w => w.itemType === "Hotel").map(w => w.itemId);
    const rideIds = wishlist.filter(w => w.itemType === "Transport").map(w => w.itemId);

    const [hotels, rides] = await Promise.all([
      Hotel.find({ _id: { $in: hotelIds } }),
      Transport.find({ _id: { $in: rideIds } })
    ]);

    const items = wishlist.map(w => {
      const item = w.itemType === "Hotel" 
        ? hotels.find(h => h._id.toString() === w.itemId.toString())
        : rides.find(r => r._id.toString() === w.itemId.toString());
      return item ? { itemType: w.itemType, item } : null;
    }).filter(Boolean);

    res.json({ success: true, data: items });
  } catch (err) { res.status(500).json({ success: false, message: "Item sync failed" }); }
};

exports.toggleWishlist = async (req, res) => {
  try {
    const { itemType, itemId } = req.body;
    if (!["Hotel", "Transport"].includes(itemType) || !itemId) {
      return res.status(400).json({ success: false, message: "Valid itemType and itemId are required" });
    }

    const user = await resolveAppUser(req);
    if (!user.wishlist) user.wishlist = [];

    const idx = user.wishlist.findIndex(
      (w) => String(w.itemId) === String(itemId) && w.itemType === itemType
    );
    if (idx >= 0) user.wishlist.splice(idx, 1);
    else user.wishlist.push({ itemType, itemId });

    await user.save();
    res.json({ success: true, wishlist: user.wishlist });
  } catch (err) { res.status(500).json({ success: false, message: "Toggle failed" }); }
};
