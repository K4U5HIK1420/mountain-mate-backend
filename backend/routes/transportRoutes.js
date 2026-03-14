const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

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
router.post("/add", auth, upload.array("images", 5), addTransport);
router.get("/my-rides", auth, getMyRides);
router.patch("/update/:id", auth, updateTransport); // ✅ Line 21 fixed

// ADMIN
router.get("/admin/all", auth, getAllRidesForAdmin);
router.patch("/verify", auth, verifyTransport);

module.exports = router;