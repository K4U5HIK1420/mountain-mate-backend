const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const optionalAuth = require("../middleware/optionalAuth");
const supportAdminAuth = require("../middleware/supportAdminAuth");
const validate = require("../middleware/validate");
const { supportLimiter } = require("../middleware/rateLimiters");
const controller = require("../controllers/supportController");

router.post(
  "/chat",
  supportLimiter,
  optionalAuth,
  [body("message").isString().trim().isLength({ min: 1, max: 1500 })],
  validate,
  controller.chat
);
router.get("/conversations/:id", optionalAuth, [param("id").isString().trim().isLength({ min: 6, max: 120 })], validate, controller.getConversation);

router.get("/admin/conversations", supportAdminAuth, controller.listAdminConversations);
router.post(
  "/admin/conversations/:id/reply",
  supportAdminAuth,
  [param("id").isString().trim(), body("message").isString().trim().isLength({ min: 1, max: 1500 })],
  validate,
  controller.replyAsAdmin
);
router.delete(
  "/admin/conversations/:id/messages/:messageId",
  supportAdminAuth,
  [param("id").isString().trim(), param("messageId").isString().trim()],
  validate,
  controller.deleteMessageAsAdmin
);

module.exports = router;
