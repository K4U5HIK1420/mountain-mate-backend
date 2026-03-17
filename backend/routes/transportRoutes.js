const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { supabaseAuth, requireRole } = require("../middleware/supabaseAuthMiddleware");

// ⚠️ Ensure karo ki ye saare functions Controller mein 'exports.functionName' karke likhe hain
const { 
  addTransport, 
  getTransports, 
  searchTransport, 
  getAllRidesForAdmin,
  verifyTransport,
  getMyRides,      
  updateTransport, 
  bookRide 
} = require("../controllers/transportController");

// PUBLIC
router.get("/all", getTransports);
router.get("/search", searchTransport);
router.post("/book", bookRide);

// OWNER
router.post("/add", supabaseAuth, upload.array("images", 5), addTransport);
router.get("/my-rides", supabaseAuth, getMyRides);
router.patch("/update/:id", supabaseAuth, updateTransport); // ✅ Line 21 fixed

// ADMIN
router.get("/admin/all", supabaseAuth, requireRole("admin"), getAllRidesForAdmin);
router.patch("/verify", supabaseAuth, requireRole("admin"), verifyTransport);

module.exports = router;