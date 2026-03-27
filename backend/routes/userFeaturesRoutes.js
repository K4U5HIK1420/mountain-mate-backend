const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const anyAuth = require("../middleware/anyAuth");
// Dost ka naya middleware
const { supabaseAuth } = require("../middleware/supabaseAuthMiddleware");

const {
  getWishlist,
  getWishlistItems,
  toggleWishlist,
  getMyBookings,
  // Role-Based Booking Features (Naye wale)
  getPartnerIncomingBookings,
  updateBookingStatus,
  // Tere Features
  getReferralStats,
  redeemCode,
  // Dost ka Feature
  setupProfile,
} = require("../controllers/userFeaturesController");

// --- Standard User Routes ---
router.get("/wishlist", auth, getWishlist);
router.get("/wishlist/items", auth, getWishlistItems);
router.post("/wishlist/toggle", auth, toggleWishlist);

// --- Booking Routes (Role Based) ---
// 1. User apni bookings dekhega
router.get("/bookings", anyAuth, getMyBookings);
// 2. Partner apne listed items ki bookings dekhega
router.get("/partner/incoming", anyAuth, getPartnerIncomingBookings);
// 3. Partner booking status update karega
router.post("/bookings/update-status", anyAuth, updateBookingStatus);

// --- Dost ka Profile Setup ---
router.post("/setup-profile", supabaseAuth, setupProfile);

// --- Tere Referral Routes ---
router.get("/referral", auth, getReferralStats);
router.post("/referral/redeem", auth, redeemCode);

module.exports = router;
