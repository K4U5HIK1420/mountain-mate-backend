const razorpay = require("../config/razorpay");
const crypto = require("crypto");
const Booking = require("../models/Booking");

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

    const booking = await Booking.findById(bookingId);

        booking.orderId = order.id;
        booking.paymentStatus = "pending";

        await booking.save();
        res.json(order);
    await Booking.findByIdAndUpdate(bookingId, {
      orderId: order.id,
    });

    res.json(order);
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

    // TEMP: skip real Razorpay verification
    booking.paymentId = paymentId;
    booking.paymentStatus = "paid";
    booking.status = "confirmed";

    await booking.save();

    res.json({ success: true });

  } catch (error) {
    res.status(500).json({ success: false });
  }
};

