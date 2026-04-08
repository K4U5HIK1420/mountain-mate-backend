const { body } = require("express-validator");
const validate = require("../middleware/validate");
const auth = require("../middleware/authMiddleware");
const anyAuth = require("../middleware/anyAuth");
const upload = require("../middleware/upload");
const { bookingLimiter } = require("../middleware/rateLimiters");
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
  bookingLimiter,
  anyAuth,
  [
    body("customerName").isString().trim().isLength({ min: 2, max: 80 }).withMessage("Name required"),
    body("phoneNumber").isString().trim().matches(/^[0-9]{10,15}$/).withMessage("Invalid phone"),
    body("bookingType").isIn(["Hotel", "Transport"]).withMessage("Invalid booking type"),
    body("listingId").isString().trim().notEmpty(),
    body("date").isISO8601().withMessage("Date required"),
    body("guests").optional().isInt({ min: 1, max: 20 }),
    body("rooms").optional().isInt({ min: 1, max: 20 }),
    body("amount").optional().isFloat({ min: 0, max: 1000000 }),
    body().custom((value) => {
      const allowed = ["customerName", "phoneNumber", "bookingType", "listingId", "date", "startDate", "endDate", "guests", "rooms", "amount"];
      const keys = Object.keys(value || {});
      if (keys.some((key) => !allowed.includes(key))) {
        throw new Error("Unexpected fields in request.");
      }
      return true;
    }),
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
