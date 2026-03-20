const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const { createTrip, getMyTrips, updateTrip, deleteTrip } = require("../controllers/tripController");

router.get("/", auth, getMyTrips);
router.post("/", auth, createTrip);
router.patch("/:id", auth, updateTrip);
router.delete("/:id", auth, deleteTrip);

module.exports = router;

