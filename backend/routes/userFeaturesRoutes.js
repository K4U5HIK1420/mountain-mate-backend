const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const {
  getWishlist,
  getWishlistItems,
  toggleWishlist,
  getMyBookings,
} = require("../controllers/userFeaturesController");

router.get("/wishlist", auth, getWishlist);
router.get("/wishlist/items", auth, getWishlistItems);
router.post("/wishlist/toggle", auth, toggleWishlist);
router.get("/bookings", auth, getMyBookings);

module.exports = router;

