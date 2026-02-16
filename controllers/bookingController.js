const Booking = require("../models/Booking");

// Create Booking
exports.createBooking = async (req, res) => {
    try {
        const booking = new Booking(req.body);
        await booking.save();
        res.status(201).json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get All Bookings
exports.getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find().populate("listingId");
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update Booking Status
exports.updateBookingStatus = async (req, res) => {
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

exports.getBookingsByStatus = async (req, res) => {
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
    res.status(500).json({ message: error.message });
  }
};

exports.getBookingStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();

    res.json({
      success: true,
      totalBookings
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
