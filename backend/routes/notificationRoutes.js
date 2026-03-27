const express = require("express");
const anyAuth = require("../middleware/anyAuth");
const { getMyNotifications, markMyNotificationsRead } = require("../controllers/notificationController");

const router = express.Router();

router.get("/", anyAuth, getMyNotifications);
router.patch("/read", anyAuth, markMyNotificationsRead);

module.exports = router;
