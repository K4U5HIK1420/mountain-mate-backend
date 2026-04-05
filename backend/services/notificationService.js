const UserNotification = require("../models/UserNotification");
const mongoose = require("mongoose");

function isMongoReady() {
  return mongoose.connection.readyState === 1;
}

async function createNotification({ userId, title, message, type = "system", data = {} }, io) {
  if (!userId) return null;
  const liveNotification = {
    _id: `live-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    userId: String(userId),
    title,
    message,
    type,
    data,
    read: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let notification = liveNotification;
  if (isMongoReady()) {
    try {
      notification = await UserNotification.create({
        userId: String(userId),
        title,
        message,
        type,
        data,
      });
    } catch (_err) {
      notification = liveNotification;
    }
  }

  if (io) {
    io.to(`user:${String(userId)}`).emit("notification:new", notification);
  }

  return notification;
}

module.exports = { createNotification };
