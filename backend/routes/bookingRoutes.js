const { body } = require("express-validator");
const validate = require("../middleware/validate");
const auth = require("../middleware/authMiddleware");
const anyAuth = require("../middleware/anyAuth");
const upload = require("../middleware/upload");
const express = require("express");
const router = express.Router();
const {
  createBooking,
  getBookings,
  getMyBookingById,
  getTrackingBooking,
  updateBookingStatus,
  updateTrackingStatus,
  getBookingsByStatus,
  getBookingStats,
  getRevenueStats,
  getStatusStats,
  cancelMyBooking,
  submitManualPaymentProof,
} = require("../controllers/bookingController");

router.post(
  "/create",
  anyAuth,
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
router.get("/me/:id", anyAuth, getMyBookingById);
router.get("/tracking/:id", anyAuth, getTrackingBooking);
router.patch("/tracking/:id/status", anyAuth, updateTrackingStatus);
router.put("/update/:id", auth, updateBookingStatus);
router.put("/status/:id", updateBookingStatus);
router.get("/status/:status", getBookingsByStatus);
router.get("/stats", getBookingStats);
router.get("/revenue", getRevenueStats);
router.get("/stats/status", getStatusStats);
router.patch("/cancel/:id", anyAuth, cancelMyBooking);
router.post("/:id/manual-payment", anyAuth, upload.single("paymentProof"), submitManualPaymentProof);

module.exports = router;
