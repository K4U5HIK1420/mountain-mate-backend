const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const anyAuth = require("../middleware/anyAuth");
const {
  registerUser,
  loginUser,
  getMe,
  updateMe,
  forgotPassword,
  resetPassword,
  getReferral,
  redeemReferral,
} = require("../controllers/userAuthController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", auth, getMe);
router.patch("/me", auth, updateMe);
router.get("/referral", anyAuth, getReferral);
router.post("/referral/redeem", anyAuth, redeemReferral);

module.exports = router;
