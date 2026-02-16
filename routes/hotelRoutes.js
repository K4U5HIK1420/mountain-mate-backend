const auth = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();
const { addHotel, getHotels, searchHotels } = require("../controllers/hotelController");

router.post("/add", auth, addHotel);
router.get("/all", getHotels);
router.get("/search", searchHotels);


module.exports = router;
