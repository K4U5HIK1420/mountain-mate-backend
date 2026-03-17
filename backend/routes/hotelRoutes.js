const upload = require("../middleware/upload");
const { supabaseAuth, requireRole } = require("../middleware/supabaseAuthMiddleware");
const express = require("express");
const router = express.Router();

// Controller functions ko sahi se import kiya hai
const { 
    addHotel, 
    getHotels, 
    searchHotels, 
    deleteHotelImage,
    getAllHotelsForAdmin, 
    verifyHotel,
    getMyHotels,
    updateHotel // Controller se naya function
} = require("../controllers/hotelController");

// --- 1. PUBLIC ROUTES (Explore Page) ---
router.get("/all", getHotels);
router.get("/search", searchHotels);


// --- 2. PARTNER/OWNER ROUTES (Property Management) ---

// Naya property add karne ke liye
router.post("/add", supabaseAuth, upload.array("images", 5), addHotel);

// Sirf login user ke apne hotels fetch karne ke liye (Manage Stays Page)
router.get("/my-hotels", supabaseAuth, getMyHotels);

// ✅ Inventory update karne ke liye (Rooms/Price change)
router.patch("/update/:id", supabaseAuth, updateHotel);

// Image delete karne ke liye
router.delete("/delete-image", supabaseAuth, deleteHotelImage);


// --- 3. ADMIN ROUTES (Vault Management) ---
router.get("/admin/all", supabaseAuth, requireRole("admin"), getAllHotelsForAdmin);
router.patch("/verify", supabaseAuth, requireRole("admin"), verifyHotel);

module.exports = router;