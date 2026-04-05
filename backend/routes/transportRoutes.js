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
router.post(
  "/add",
  supabaseAuth,
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "driverPhoto", maxCount: 1 },
    { name: "driverLicenseDoc", maxCount: 1 },
    { name: "driverAadhaarDoc", maxCount: 1 },
    { name: "vehicleRcDoc", maxCount: 1 },
    { name: "vehicleInsuranceDoc", maxCount: 1 },
    { name: "vehiclePermitDoc", maxCount: 1 },
    { name: "pollutionCertificateDoc", maxCount: 1 },
    { name: "fitnessCertificateDoc", maxCount: 1 },
  ]),
  addTransport
);
router.get("/my-rides", supabaseAuth, getMyRides);
router.patch(
  "/update/:id",
  supabaseAuth,
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "driverPhoto", maxCount: 1 },
    { name: "driverLicenseDoc", maxCount: 1 },
    { name: "driverAadhaarDoc", maxCount: 1 },
    { name: "vehicleRcDoc", maxCount: 1 },
    { name: "vehicleInsuranceDoc", maxCount: 1 },
    { name: "vehiclePermitDoc", maxCount: 1 },
    { name: "pollutionCertificateDoc", maxCount: 1 },
    { name: "fitnessCertificateDoc", maxCount: 1 },
  ]),
  updateTransport
); // ride can be updated later with files too

// ADMIN
router.get("/admin/all", supabaseAuth, requireRole("admin"), getAllRidesForAdmin);
router.patch("/verify", supabaseAuth, requireRole("admin"), verifyTransport);

module.exports = router;

