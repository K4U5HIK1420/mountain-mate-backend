const auth = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();
const { createBooking, getBookings, updateBookingStatus, getBookingsByStatus, getBookingStats, getRevenueStats } = require("../controllers/bookingController");

router.post("/create", createBooking);
router.get("/all", getBookings);
router.put("/update/:id", auth, updateBookingStatus);
router.put("/status/:id", updateBookingStatus);
router.get("/status/:status", getBookingsByStatus);
router.get("/stats", getBookingStats);
router.get("/revenue", getRevenueStats);

module.exports = router;
