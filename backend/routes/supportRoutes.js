const express = require("express");
const router = express.Router();
const { supabaseAuth, requireRole } = require("../middleware/supabaseAuthMiddleware");
const controller = require("../controllers/supportController");

router.post("/chat", controller.chat);
router.get("/conversations/:id", controller.getConversation);

router.get("/admin/conversations", supabaseAuth, requireRole("admin"), controller.listAdminConversations);
router.post("/admin/conversations/:id/reply", supabaseAuth, requireRole("admin"), controller.replyAsAdmin);

module.exports = router;
