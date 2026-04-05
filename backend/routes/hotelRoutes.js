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
router.post(
  "/add",
  supabaseAuth,
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "ownerPhoto", maxCount: 1 },
    { name: "ownerAadhaarDoc", maxCount: 1 },
    { name: "ownerPanDoc", maxCount: 1 },
    { name: "propertyRegistrationDoc", maxCount: 1 },
    { name: "tradeLicenseDoc", maxCount: 1 },
    { name: "gstCertificateDoc", maxCount: 1 },
    { name: "fireSafetyDoc", maxCount: 1 },
  ]),
  addHotel
);

// Sirf login user ke apne hotels fetch karne ke liye (Manage Stays Page)
router.get("/my-hotels", supabaseAuth, getMyHotels);

// ✅ Inventory update karne ke liye (Rooms/Price change)
router.patch(
  "/update/:id",
  supabaseAuth,
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "ownerPhoto", maxCount: 1 },
    { name: "ownerAadhaarDoc", maxCount: 1 },
    { name: "ownerPanDoc", maxCount: 1 },
    { name: "propertyRegistrationDoc", maxCount: 1 },
    { name: "tradeLicenseDoc", maxCount: 1 },
    { name: "gstCertificateDoc", maxCount: 1 },
    { name: "fireSafetyDoc", maxCount: 1 },
  ]),
  updateHotel
);

// Image delete karne ke liye
router.delete("/delete-image", supabaseAuth, deleteHotelImage);


// --- 3. ADMIN ROUTES (Vault Management) ---
router.get("/admin/all", supabaseAuth, requireRole("admin"), getAllHotelsForAdmin);
router.patch("/verify", supabaseAuth, requireRole("admin"), verifyHotel);

module.exports = router;
