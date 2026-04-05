const express = require("express");
const router = express.Router();
const anyAuth = require("../middleware/anyAuth");

const {
  getRazorpayKey,
  createOrder,
  verifyPayment,
  handleWebhook,
} = require("../controllers/paymentController");

router.post("/webhook", handleWebhook);
router.get("/key", anyAuth, getRazorpayKey);
router.post("/create-order", anyAuth, createOrder);
router.post("/verify", anyAuth, verifyPayment);

module.exports = router;
