const Booking = require("../models/Booking");
const User = require("../models/User");

exports.listBookings = async (req, res, next) => {
  try {
    const { status } = req.query;
    const q = {};
    if (status) q.status = status;

    const data = await Booking.find(q)
      .sort({ createdAt: -1 })
      .populate("listingId")
      .populate("user", "name email");

    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.updateBooking = async (req, res, next) => {
  try {
    const { status, paymentStatus } = req.body || {};
    const update = {};
    if (status) update.status = status;
    if (paymentStatus) update.paymentStatus = paymentStatus;

    const booking = await Booking.findByIdAndUpdate(req.params.id, { $set: update }, { new: true })
      .populate("listingId")
      .populate("user", "name email");

    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    return res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
};

exports.stats = async (req, res, next) => {
  try {
    const [users, bookings] = await Promise.all([
      User.countDocuments(),
      Booking.countDocuments(),
    ]);
    const byStatus = await Booking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
    const byPayment = await Booking.aggregate([{ $group: { _id: "$paymentStatus", count: { $sum: 1 } } }]);

    return res.json({
      success: true,
      data: { users, bookings, byStatus, byPayment },
    });
  } catch (err) {
    next(err);
  }
};

