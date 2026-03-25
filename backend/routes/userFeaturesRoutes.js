const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
// Dost ka naya middleware
const { supabaseAuth } = require("../middleware/supabaseAuthMiddleware");

const {
  getWishlist,
  getWishlistItems,
  toggleWishlist,
  getMyBookings,
  // Tere Features
  getReferralStats,
  redeemCode,
  // Dost ka Feature
  setupProfile,
} = require("../controllers/userFeaturesController");

// Standard Routes
router.get("/wishlist", auth, getWishlist);
router.get("/wishlist/items", auth, getWishlistItems);
router.post("/wishlist/toggle", auth, toggleWishlist);
router.get("/bookings", auth, getMyBookings);

// Dost ka Profile Setup (Supabase Auth use kar raha hai)
router.post("/setup-profile", supabaseAuth, setupProfile);

// Tere Referral Routes
router.get("/referral", auth, getReferralStats);
router.post("/referral/redeem", auth, redeemCode);

module.exports = router;