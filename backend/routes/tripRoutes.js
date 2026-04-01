const express = require("express");
const router = express.Router();
const anyAuth = require("../middleware/anyAuth");

const { createTrip, getMyTrips, updateTrip, deleteTrip } = require("../controllers/tripController");

router.get("/", anyAuth, getMyTrips);
router.get("/my-trips", anyAuth, getMyTrips);
router.post("/", anyAuth, createTrip);
router.patch("/:id", anyAuth, updateTrip);
router.delete("/:id", anyAuth, deleteTrip);

module.exports = router;

