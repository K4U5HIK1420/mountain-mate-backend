const express = require("express");
const { supabaseAuth, requireRole } = require("../middleware/supabaseAuthMiddleware");
const controller = require("../controllers/adminConsoleController");

const router = express.Router();

router.use(supabaseAuth, requireRole("admin"));

router.get("/overview", controller.getOverview);
router.get("/audit", controller.listAuditLogs);
router.get("/export/:section", controller.exportSection);

router.get("/users", controller.listUsers);
router.patch("/users/:id", controller.updateUser);
router.delete("/users/:id", controller.terminateUser);

router.get("/user-meta", controller.listUserMeta);
router.patch("/user-meta/:id", controller.updateUserMeta);
router.delete("/user-meta/:id", controller.deleteUserMeta);

router.get("/hotels", controller.listHotels);
router.patch("/hotels/:id", controller.updateHotel);
router.delete("/hotels/:id", controller.deleteHotel);

router.get("/rides", controller.listRides);
router.patch("/rides/:id", controller.updateRide);
router.delete("/rides/:id", controller.deleteRide);

router.get("/bookings", controller.listBookings);
router.patch("/bookings/:id", controller.updateBooking);
router.delete("/bookings/:id", controller.deleteBooking);

router.get("/trips", controller.listTrips);
router.patch("/trips/:id", controller.updateTrip);
router.delete("/trips/:id", controller.deleteTrip);

router.get("/reviews", controller.listReviews);
router.delete("/reviews/:id", controller.deleteReview);

router.post("/bulk", controller.bulkAction);

router.get("/raw/:collection", controller.getRawCollection);
router.patch("/raw/:collection/:id", controller.updateRawRecord);
router.delete("/raw/:collection/:id", controller.deleteRawRecord);

module.exports = router;
