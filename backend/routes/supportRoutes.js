const express = require("express");
const router = express.Router();
const optionalAuth = require("../middleware/optionalAuth");
const supportAdminAuth = require("../middleware/supportAdminAuth");
const controller = require("../controllers/supportController");

router.post("/chat", optionalAuth, controller.chat);
router.get("/conversations/:id", optionalAuth, controller.getConversation);

router.get("/admin/conversations", supportAdminAuth, controller.listAdminConversations);
router.post("/admin/conversations/:id/reply", supportAdminAuth, controller.replyAsAdmin);

module.exports = router;
