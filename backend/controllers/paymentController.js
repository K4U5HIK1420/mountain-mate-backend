const razorpay = require("../config/razorpay");
const crypto = require("crypto");
const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const Transport = require("../models/Transport");
const { createNotification } = require("../services/notificationService");

// CREATE ORDER
exports.createOrder = async (req, res) => {
  try {
    const { amount, bookingId } = req.body;

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: bookingId,
    };

    const order = await razorpay.orders.create(options);
        
    // save orderId in booking
    await Booking.findByIdAndUpdate(
      bookingId,
      { orderId: order.id, paymentStatus: "pending" },
      { new: true }
    );

    return res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




// VERIFY PAYMENT
exports.verifyPayment = async (req, res) => {
  try {
    const { bookingId, paymentId, orderId } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking || booking.orderId !== orderId) {
      return res.status(400).json({ success: false });
    }

    if (booking.paymentStatus === "paid") {
      return res.json({ success: true });
    }

    if (booking.bookingType === "Transport") {
      const seatsRequested = Math.max(1, Number(booking.guests || 1));
      const ride = await Transport.findById(booking.listingId);
      if (!ride || ride.seatsAvailable < seatsRequested) {
        return res.status(400).json({
          success: false,
          message: "Selected ride is no longer available.",
        });
      }
      ride.seatsAvailable -= seatsRequested;
      await ride.save();
    }

    if (booking.bookingType === "Hotel") {
      const roomsRequested = Math.max(1, Number(booking.rooms || 1));
      const hotel = await Hotel.findById(booking.listingId);
      if (!hotel || hotel.roomsAvailable < roomsRequested) {
        return res.status(400).json({
          success: false,
          message: "Selected stay is no longer available.",
        });
      }
      hotel.roomsAvailable -= roomsRequested;
      await hotel.save();
    }

    // TEMP: skip real Razorpay verification
    booking.paymentId = paymentId;
    booking.paymentStatus = "paid";
    booking.status = "pending";

    await booking.save();

    await createNotification(
      {
        userId: booking.ownerId,
        title: "New booking request",
        message: `${booking.customerName} requested ${booking.listingLabel || "your listing"}.`,
        type: "booking_request",
        data: { bookingId: String(booking._id), bookingType: booking.bookingType },
      },
      req.app.get("io")
    );

    await createNotification(
      {
        userId: booking.userId,
        title: "Payment received",
        message: `Your booking for ${booking.listingLabel || "the selected listing"} is waiting for owner confirmation.`,
        type: "booking_paid",
        data: { bookingId: String(booking._id), bookingType: booking.bookingType },
      },
      req.app.get("io")
    );

    res.json({ success: true });

  } catch (error) {
    res.status(500).json({ success: false });
  }
};
