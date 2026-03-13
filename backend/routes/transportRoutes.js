const auth = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();
const { 
  addTransport, 
  getTransports, 
  searchTransport, 
  getAllRidesForAdmin,
  verifyTransport,
  bookRide
} = require("../controllers/transportController");
const upload = require("../middleware/upload");

router.post("/add", upload.array("images", 5), addTransport);
router.get("/all", getTransports);
router.get("/search", searchTransport);
router.get("/admin/all", getAllRidesForAdmin);
router.patch("/verify", verifyTransport);
router.post("/book", bookRide);


module.exports = router;
