const UserNotification = require("../models/UserNotification");
const mongoose = require("mongoose");

function isMongoReady() {
  return mongoose.connection.readyState === 1;
}

async function createNotification({ userId, title, message, type = "system", data = {} }, io) {
  if (!userId) return null;
  if (!isMongoReady()) return null;

  let notification = null;
  try {
    notification = await UserNotification.create({
      userId: String(userId),
      title,
      message,
      type,
      data,
    });
  } catch (_err) {
    return null;
  }

  if (io) {
    io.to(`user:${String(userId)}`).emit("notification:new", notification);
  }

  return notification;
}

module.exports = { createNotification };
