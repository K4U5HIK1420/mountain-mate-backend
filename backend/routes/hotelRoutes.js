const upload = require("../middleware/upload");
const authMiddleware = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();
const { 
    addHotel, 
    getHotels, 
    searchHotels, 
    deleteHotelImage,
    getAllHotelsForAdmin, 
    verifyHotel 
} = require("../controllers/hotelController");

// --- 1. PUBLIC ROUTES (Explore Page) ---
// Sirf isVerified: true wale hotels dikhayenge
router.get("/all", getHotels);
router.get("/search", searchHotels);

// --- 2. PARTNER ROUTES (Property Listing) ---
// Multiple images (max 5) upload ke liye upload.array use kiya hai
// 'images' wahi name hai jo tune frontend FormData mein use kiya hai
router.post("/add", upload.array("images", 5), addHotel);

// Image delete karne ke liye (Auth required)
router.delete("/delete-image", authMiddleware, deleteHotelImage);

// --- 3. ADMIN ROUTES (Vault Management) ---
// Dashboard par saare pending/approved hotels dekhne ke liye
//router.get("/admin/all", authMiddleware, getAllHotelsForAdmin);
router.get("/admin/all", getAllHotelsForAdmin);
// Status update karne ke liye (Approve/Reject)
//router.patch("/verify", authMiddleware, verifyHotel);
router.patch("/verify", verifyHotel);

module.exports = router;