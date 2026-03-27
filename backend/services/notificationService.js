const UserNotification = require("../models/UserNotification");

async function createNotification({ userId, title, message, type = "system", data = {} }, io) {
  if (!userId) return null;

  const notification = await UserNotification.create({
    userId: String(userId),
    title,
    message,
    type,
    data,
  });

  if (io) {
    io.to(`user:${String(userId)}`).emit("notification:new", notification);
  }

  return notification;
}

module.exports = { createNotification };
