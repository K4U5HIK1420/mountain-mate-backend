const upload = require("../middleware/upload");
const authMiddleware = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();
const { addHotel, getHotels, searchHotels } = require("../controllers/hotelController");

router.post("/add", authMiddleware, upload.array("images", 5), addHotel);
router.get("/all", getHotels);
router.get("/search", searchHotels);


module.exports = router;
