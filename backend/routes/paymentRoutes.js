const express = require("express");
const router = express.Router();
const anyAuth = require("../middleware/anyAuth");

const {
  getRazorpayKey,
  createOrder,
  verifyPayment,
} = require("../controllers/paymentController");

router.get("/key", anyAuth, getRazorpayKey);
router.post("/create-order", anyAuth, createOrder);
router.post("/verify", anyAuth, verifyPayment);

module.exports = router;
