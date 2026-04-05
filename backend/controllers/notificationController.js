const UserNotification = require("../models/UserNotification");
const mongoose = require("mongoose");
const { getDataStore } = require("../utils/dataStore");
const supabaseBookings = require("../services/supabaseBookingsStore");

function isMongoReady() {
  return mongoose.connection.readyState === 1;
}

function toNotificationId(prefix, bookingId, suffix) {
  return `${prefix}:${bookingId}:${suffix}`;
}

function sortNotifications(items = []) {
  return items
    .filter(Boolean)
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 20);
}

async function buildSupabaseNotifications(req) {
  const userId = String(req.user?.id || req.user?._id || "");
  const role = String(req.user?.role || req.user?.app_metadata?.role || req.user?.user_metadata?.role || "").toLowerCase();
  const notifications = [];

  if (role === "admin") {
    const bookings = await supabaseBookings.listAllBookings();
    bookings
      .filter((booking) => String(booking.paymentStatus || "").toLowerCase() === "under_review")
      .forEach((booking) => {
        notifications.push({
          _id: toNotificationId("admin-payment", booking._id, "review"),
          userId,
          title: "Payment awaiting review",
          message: `${booking.customerName || "A customer"} submitted payment proof for ${booking.listingLabel || "a booking"}.`,
          type: "payment_review",
          read: false,
          createdAt: booking.updatedAt || booking.createdAt || new Date().toISOString(),
          data: { bookingId: String(booking._id), bookingType: booking.bookingType, stage: "payment_under_review" },
        });
      });
  }

  const myBookings = await supabaseBookings.listBookingsByUserId(userId);
  myBookings.forEach((booking) => {
    const createdAt = booking.updatedAt || booking.createdAt || new Date().toISOString();
    if (booking.paymentStatus === "under_review") {
      notifications.push({
        _id: toNotificationId("booking", booking._id, "payment-under-review"),
        userId,
        title: "Payment proof submitted",
        message: `Your payment proof for ${booking.listingLabel || "this booking"} is under admin review.`,
        type: "system",
        read: false,
        createdAt,
        data: { bookingId: String(booking._id), bookingType: booking.bookingType, stage: "payment_under_review" },
      });
    }
    if (booking.paymentStatus === "paid") {
      notifications.push({
        _id: toNotificationId("booking", booking._id, "payment-approved"),
        userId,
        title: "Payment approved",
        message: `Your payment for ${booking.listingLabel || "the selected booking"} has been approved.`,
        type: "booking_paid",
        read: false,
        createdAt,
        data: { bookingId: String(booking._id), bookingType: booking.bookingType, stage: "payment_approved" },
      });
    }
    if (booking.paymentStatus === "failed") {
      notifications.push({
        _id: toNotificationId("booking", booking._id, "payment-failed"),
        userId,
        title: "Payment update needed",
        message: `Your payment proof for ${booking.listingLabel || "the selected booking"} needs attention. Please review the booking status and submit again if needed.`,
        type: "booking_declined",
        read: false,
        createdAt,
        data: { bookingId: String(booking._id), bookingType: booking.bookingType, stage: "payment_declined" },
      });
    }
    if (booking.status === "confirmed") {
      notifications.push({
        _id: toNotificationId("booking", booking._id, "confirmed"),
        userId,
        title: "Booking confirmed",
        message: `Your booking for ${booking.listingLabel || "the selected listing"} has been confirmed.`,
        type: "booking_confirmed",
        read: false,
        createdAt,
        data: { bookingId: String(booking._id), bookingType: booking.bookingType, stage: "confirmed" },
      });
    }
    if (booking.status === "declined") {
      notifications.push({
        _id: toNotificationId("booking", booking._id, "declined"),
        userId,
        title: "Booking declined",
        message: `Your booking for ${booking.listingLabel || "the selected listing"} was declined by the owner or driver.`,
        type: "booking_declined",
        read: false,
        createdAt,
        data: { bookingId: String(booking._id), bookingType: booking.bookingType, stage: "declined" },
      });
    }
  });

  const ownerBookings = await supabaseBookings.listBookingsByOwnerId(userId);
  ownerBookings.forEach((booking) => {
    if (booking.paymentStatus === "paid") {
      notifications.push({
        _id: toNotificationId("owner-booking", booking._id, "paid"),
        userId,
        title: "Paid booking ready",
        message: `${booking.customerName || "A customer"} has completed payment for ${booking.listingLabel || "your listing"}.`,
        type: "booking_request",
        read: false,
        createdAt: booking.updatedAt || booking.createdAt || new Date().toISOString(),
        data: { bookingId: String(booking._id), bookingType: booking.bookingType, stage: "payment_approved" },
      });
    }
  });

  const data = sortNotifications(notifications);
  return { data, unreadCount: data.length };
}

exports.getMyNotifications = async (req, res, next) => {
  try {
    if (!isMongoReady()) {
      if (getDataStore() === "supabase") {
        const derived = await buildSupabaseNotifications(req);
        return res.json({ success: true, ...derived });
      }
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
