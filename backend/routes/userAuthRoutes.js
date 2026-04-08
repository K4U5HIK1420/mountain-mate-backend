const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const auth = require("../middleware/authMiddleware");
const anyAuth = require("../middleware/anyAuth");
const validate = require("../middleware/validate");
const { authLimiter } = require("../middleware/rateLimiters");
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

router.post(
  "/register",
  authLimiter,
  [
    body("name").isString().trim().isLength({ min: 2, max: 80 }),
    body("email").isEmail().normalizeEmail(),
    body("password").isString().isLength({ min: 8, max: 128 }),
    body().custom((value) => {
      const allowed = ["name", "email", "password", "referralCode"];
      const keys = Object.keys(value || {});
      if (keys.some((key) => !allowed.includes(key))) {
        throw new Error("Unexpected fields in request.");
      }
      return true;
    }),
  ],
  validate,
  registerUser
);
router.post(
  "/login",
  authLimiter,
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isString().isLength({ min: 8, max: 128 }),
    body().custom((value) => {
      const allowed = ["email", "password"];
      const keys = Object.keys(value || {});
      if (keys.some((key) => !allowed.includes(key))) {
        throw new Error("Unexpected fields in request.");
      }
      return true;
    }),
  ],
  validate,
  loginUser
);
router.post("/forgot-password", authLimiter, [body("email").isEmail().normalizeEmail()], validate, forgotPassword);
router.post("/reset-password", authLimiter, [body("token").isString().isLength({ min: 10 }), body("newPassword").isString().isLength({ min: 8, max: 128 })], validate, resetPassword);
router.get("/me", auth, getMe);
router.patch("/me", auth, updateMe);
router.get("/referral", anyAuth, getReferral);
router.post("/referral/redeem", anyAuth, [body("code").isString().trim().isLength({ min: 4, max: 32 })], validate, redeemReferral);

module.exports = router;
