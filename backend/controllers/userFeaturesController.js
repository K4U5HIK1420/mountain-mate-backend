const User = require("../models/User");
const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const Transport = require("../models/Transport");
const { restoreBookingInventory } = require("../utils/bookingInventory");
const { createNotification } = require("../services/notificationService");

// --- 🏔️ PROFILE SETUP ---
exports.setupProfile = async (req, res) => {
  try {
    const { fullName, phone, avatarUrl } = req.body;
    const supabaseUser = req.user; 

    let user = await User.findOne({ email: supabaseUser.email });

    if (user) {
      user.fullName = fullName || user.fullName;
      user.phone = phone || user.phone;
      user.avatarUrl = avatarUrl || user.avatarUrl;
      await user.save();
    } else {
      user = await User.create({
        email: supabaseUser.email,
        fullName,
        phone,
        avatarUrl,
        referrals: {
          code: `MM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          invitedUsers: [],
          credits: 0
        }
      });
    }
    res.json({ success: true, message: "Profile Synchronized!", user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Profile sync failed" });
  }
};

// --- 🏔️ BOOKINGS LOGIC (USER + PARTNER ROLE BASED) ---

// 1. User View: Mene kahan booking ki hai?
exports.getMyBookings = async (req, res) => {
  try {
    const ownerId = String(req.user?.id || req.user?._id || "");
    const data = await Booking.find({ userId: ownerId })
      .sort({ createdAt: -1 })
      .populate("listingId");
    
    res.json({ success: true, data: data || [] });
  } catch (err) { 
    res.status(500).json({ success: false, message: "Failed to fetch your expeditions" }); 
  }
};

// 2. Partner View: Mere hotel/ride pe kisne booking ki hai?
exports.getPartnerIncomingBookings = async (req, res) => {
  try {
    const ownerId = String(req.user?.id || req.user?._id || "");
    const incoming = await Booking.find({ ownerId })
      .populate("listingId")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: incoming || [] });
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
    
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    const actorId = String(req.user?.id || req.user?._id || "");
    let resolvedOwnerId = String(booking.ownerId || "");

    if (!resolvedOwnerId || resolvedOwnerId !== actorId) {
      try {
        const ListingModel = booking.bookingType === "Hotel" ? Hotel : Transport;
        const listing = await ListingModel.findById(booking.listingId).select("owner").lean();
        resolvedOwnerId = String(listing?.owner || resolvedOwnerId || "");
        if (resolvedOwnerId && String(booking.ownerId || "") !== resolvedOwnerId) {
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

    booking.status = normalizedStatus;
    if (booking.bookingType === "Transport") {
      booking.liveTracking = {
        ...(booking.liveTracking || {}),
        status: normalizedStatus === "confirmed" ? "accepted" : "searching",
      };
    }
    await booking.save();

    try {
      await createNotification(
        {
          userId: booking.userId,
          title: normalizedStatus === "confirmed" ? "Booking confirmed" : "Booking declined",
          message:
            normalizedStatus === "confirmed"
              ? `Your booking for ${booking.listingLabel || "the selected listing"} has been confirmed.`
              : `Your booking for ${booking.listingLabel || "the selected listing"} was declined by the owner or driver.`,
          type: normalizedStatus === "confirmed" ? "booking_confirmed" : "booking_declined",
          data: { bookingId: String(booking._id), bookingType: booking.bookingType },
        },
        req.app.get("io")
      );
    } catch (_notificationErr) {
      // Don't fail the booking update if notification delivery has an issue.
    }

    res.json({ success: true, message: `Booking status updated to ${normalizedStatus}`, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Status update failed" });
  }
};

// --- 🏔️ REFERRAL SYSTEM ---
exports.getReferralStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
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
    const currentUser = await User.findById(req.user._id);
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
    referrer.referrals.invitedUsers.push(currentUser._id);

    await Promise.all([currentUser.save(), referrer.save()]);
    res.json({ success: true, message: "Credits added successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Redemption Failed" });
  }
};

// --- 🏔️ WISHLIST LOGIC ---
exports.getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, wishlist: user?.wishlist || [] });
  } catch (err) { res.status(500).json({ success: false, message: "Wishlist fetch failed" }); }
};

exports.getWishlistItems = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
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
    const user = await User.findById(req.user._id);
    if (!user.wishlist) user.wishlist = [];

    const idx = user.wishlist.findIndex(w => String(w.itemId) === String(itemId));
    if (idx >= 0) user.wishlist.splice(idx, 1);
    else user.wishlist.push({ itemType, itemId });

    await user.save();
    res.json({ success: true, wishlist: user.wishlist });
  } catch (err) { res.status(500).json({ success: false, message: "Toggle failed" }); }
};
