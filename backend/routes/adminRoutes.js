const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const requireJwtAdmin = require("../middleware/requireJwtAdmin");

const {
  listBookings,
  updateBooking,
  stats,
} = require("../controllers/adminBookingsController");

router.get("/stats", auth, requireJwtAdmin, stats);
router.get("/bookings", auth, requireJwtAdmin, listBookings);
router.patch("/bookings/:id", auth, requireJwtAdmin, updateBooking);

module.exports = router;

