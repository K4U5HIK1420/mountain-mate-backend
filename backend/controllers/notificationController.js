const UserNotification = require("../models/UserNotification");
const mongoose = require("mongoose");

function isMongoReady() {
  return mongoose.connection.readyState === 1;
}

exports.getMyNotifications = async (req, res, next) => {
  try {
    if (!isMongoReady()) {
      return res.json({ success: true, data: [], unreadCount: 0 });
    }

    const userId = String(req.user?.id || req.user?._id || "");
    const notifications = await UserNotification.find({ userId }).sort({ createdAt: -1 }).limit(20).lean();
    const unreadCount = await UserNotification.countDocuments({ userId, read: false });
    return res.json({ success: true, data: notifications, unreadCount });
  } catch (err) {
    next(err);
  }
};

exports.markMyNotificationsRead = async (req, res, next) => {
  try {
    if (!isMongoReady()) {
      return res.json({ success: true });
    }

    const userId = String(req.user?.id || req.user?._id || "");
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const query = ids.length ? { userId, _id: { $in: ids } } : { userId, read: false };
    await UserNotification.updateMany(query, { $set: { read: true } });
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
