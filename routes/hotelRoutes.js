const express = require("express");
const router = express.Router();
const { addHotel, getHotels, searchHotels } = require("../controllers/hotelController");

router.post("/add", addHotel);
router.get("/all", getHotels);
router.get("/search", searchHotels);


module.exports = router;
