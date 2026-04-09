const express = require("express");
const { supabaseAuth } = require("../middleware/supabaseAuthMiddleware");
const {
  getHotelInventory,
  updateHotelInventory,
  listOwnerHotels,
} = require("../controllers/inventoryController");

const router = express.Router();

router.get("/owner/hotels", supabaseAuth, listOwnerHotels);
router.get("/:hotelId", getHotelInventory);
router.post("/update", supabaseAuth, updateHotelInventory);

module.exports = router;

