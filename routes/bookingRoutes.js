const auth = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();
const { createBooking, getBookings, updateBookingStatus, getBookingsByStatus } = require("../controllers/bookingController");

router.post("/create", createBooking);
router.get("/all", getBookings);
router.put("/update/:id", auth, updateBookingStatus);
router.put("/status/:id", updateBookingStatus);
router.get("/status/:status", getBookingsByStatus);


module.exports = router;
