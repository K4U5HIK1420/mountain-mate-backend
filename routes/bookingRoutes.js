const auth = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();
const { createBooking, getBookings, updateBookingStatus } = require("../controllers/bookingController");

router.post("/create", createBooking);
router.get("/all", getBookings);
router.put("/update/:id", auth, updateBookingStatus);


module.exports = router;
