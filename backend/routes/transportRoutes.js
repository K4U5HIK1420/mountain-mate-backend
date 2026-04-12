const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { supabaseAuth, requireRole } = require("../middleware/supabaseAuthMiddleware");

// ⚠️ Ensure karo ki ye saare functions Controller mein 'exports.functionName' karke likhe hain
const { 
  addTransport, 
  getTransports, 
  searchTransport, 
  getSharedTaxis,
  searchSharedTaxis,
  getTaxiQuote,
  bookTaxi,
  updateTaxiBookingStatus,
  bookSharedTaxi,
  getRoutePreview,
  getAllRidesForAdmin,
  verifyTransport,
  getMyRides,      
  updateTransport, 
  deleteTransportImage,
  bookRide 
} = require("../controllers/transportController");

// PUBLIC
router.get("/all", getTransports);
router.get("/search", searchTransport);
router.get("/shared/all", getSharedTaxis);
router.get("/shared/search", searchSharedTaxis);
router.post("/taxi/quote", getTaxiQuote);
router.post("/route-preview", getRoutePreview);
router.post("/book", bookRide);
router.post("/taxi/book", supabaseAuth, bookTaxi);
router.post("/taxi/status", supabaseAuth, updateTaxiBookingStatus);
router.post("/shared/book", supabaseAuth, bookSharedTaxi);

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
router.delete("/delete-image", supabaseAuth, deleteTransportImage);

// ADMIN
router.get("/admin/all", supabaseAuth, requireRole("admin"), getAllRidesForAdmin);
router.patch("/verify", supabaseAuth, requireRole("admin"), verifyTransport);

module.exports = router;

