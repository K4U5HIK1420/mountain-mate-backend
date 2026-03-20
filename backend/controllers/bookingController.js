const Booking = require("../models/Booking");

// Create Booking
exports.createBooking = async (req, res, next) => {
    try {
        const booking = new Booking({
          ...req.body,
          // If JWT auth is used, attach user id. If public booking is used, keep null.
          user: req.user?.id || null,
        });
        await booking.save();
        res.status(201).json(booking);
    } catch (error) {
    next(error);
    }
};

// Get All Bookings
exports.getBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.find().populate("listingId");
        res.json(bookings);
    } catch (error) {
        next(error);
    }
};

// Get single booking for the logged-in user (JWT)
exports.getMyBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user.id }).populate("listingId");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    return res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
};

// Update Booking Status
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const validStatuses = ["pending", "confirmed", "completed", "cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking status",
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.json({
      success: true,
      message: "Booking status updated",
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getBookingsByStatus = async (req, res, next) => {
  try {
    const { status } = req.params;

    const validStatuses = ["pending", "confirmed", "completed", "cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const bookings = await Booking.find({ status })
      .populate("listingId");

    res.json(bookings);

  } catch (error) {
    next(error);
    }
};

exports.getBookingStats = async (req, res, next) => {
  try {
    const totalBookings = await Booking.countDocuments();

    res.json({
      success: true,
      totalBookings
    });
  } catch (error) {
    next(error);
    }
};

exports.getRevenueStats = async (req, res, next) => {
  try {
    const bookings = await Booking.find({
      status: { $in: ["confirmed", "completed"] }
    }).populate("listingId");

    let totalRevenue = 0;

    bookings.forEach(b => {
      if (b.listingId && b.listingId.pricePerNight) {
        totalRevenue += b.listingId.pricePerNight;
      }
    });

    res.json({
      success: true,
      totalRevenue
    });

  } catch (error) {
    next(error);
    }
};

exports.getStatusStats = async (req, res) => {
  try {
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    let result = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0
    };

    stats.forEach(item => {
      result[item._id] = item.count;
    });

    res.json(result);

  } catch (error) {
    next(error);
    }
};

// Cancel booking (JWT user only)
exports.cancelMyBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    if (!booking.user || String(booking.user) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    if (booking.status === "cancelled") {
      return res.json({ success: true, message: "Already cancelled", data: booking });
    }
    if (booking.status === "completed") {
      return res.status(400).json({ success: false, message: "Completed bookings cannot be cancelled" });
    }

    booking.status = "cancelled";
    booking.paymentStatus = booking.paymentStatus === "paid" ? "paid" : "failed";
    await booking.save();
    return res.json({ success: true, message: "Booking cancelled", data: booking });
  } catch (err) {
    next(err);
  }
};
