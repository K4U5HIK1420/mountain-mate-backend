const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { authLimiter } = require("../middleware/rateLimiters");
const { registerAdmin, loginAdmin } = require("../controllers/authController");

router.post(
  "/register",
  authLimiter,
  [body("email").isEmail().normalizeEmail(), body("password").isString().isLength({ min: 8, max: 128 })],
  validate,
  registerAdmin
);
router.post(
  "/login",
  authLimiter,
  [body("email").isEmail().normalizeEmail(), body("password").isString().isLength({ min: 8, max: 128 })],
  validate,
  loginAdmin
);

module.exports = router;
