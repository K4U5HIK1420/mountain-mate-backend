const { body } = require("express-validator");
const validate = require("../middleware/validate");
const auth = require("../middleware/authMiddleware");
const optionalAuth = require("../middleware/optionalAuth");
const express = require("express");
const router = express.Router();
const {
  createBooking,
  getBookings,
  getMyBookingById,
  updateBookingStatus,
  getBookingsByStatus,
  getBookingStats,
  getRevenueStats,
  getStatusStats,
  cancelMyBooking,
} = require("../controllers/bookingController");

router.post(
  "/create",
  optionalAuth,
  [
    body("customerName").notEmpty().withMessage("Name required"),
    body("phoneNumber").isLength({ min: 10 }).withMessage("Invalid phone"),
    body("bookingType").notEmpty(),
    body("listingId").notEmpty(),
    body("date").notEmpty().withMessage("Date required"),
  ],
  validate,
  createBooking
);
router.get("/all", getBookings);
router.get("/me/:id", auth, getMyBookingById);
router.put("/update/:id", auth, updateBookingStatus);
router.put("/status/:id", updateBookingStatus);
router.get("/status/:status", getBookingsByStatus);
router.get("/stats", getBookingStats);
router.get("/revenue", getRevenueStats);
router.get("/stats/status", getStatusStats);
router.patch("/cancel/:id", auth, cancelMyBooking);

module.exports = router;