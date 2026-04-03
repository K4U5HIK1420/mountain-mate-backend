const razorpay = require("../config/razorpay");
const crypto = require("crypto");
const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const Transport = require("../models/Transport");
const { createNotification } = require("../services/notificationService");
const { getDataStore } = require("../utils/dataStore");
const supabaseHotels = require("../services/supabaseHotelsStore");
const supabaseTransports = require("../services/supabaseTransportsStore");
const supabaseBookings = require("../services/supabaseBookingsStore");

function isValidMoney(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0;
}

exports.getRazorpayKey = async (_req, res) => {
  const key = process.env.RAZORPAY_KEY_ID || "";
  if (!key) {
    return res.status(500).json({ success: false, message: "Razorpay key is not configured." });
  }
  return res.json({ success: true, key });
};

// CREATE ORDER
exports.createOrder = async (req, res) => {
  try {
    const { bookingId } = req.body || {};

    if (!bookingId) {
      return res.status(400).json({ success: false, message: "bookingId is required." });
    }

    const isSupabase = getDataStore() === "supabase";
    const booking = isSupabase
      ? await supabaseBookings.getBookingById(String(bookingId))
      : await Booking.findById(bookingId).populate("listingId");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    const actorId = String(req.user?.id || req.user?._id || "");
    if (actorId && String(booking.userId || "") !== actorId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (booking.paymentStatus === "paid") {
      return res.status(400).json({ success: false, message: "Booking already paid." });
    }

    let listingForAmount = booking.listingId;
    if (isSupabase && booking.listingId) {
      listingForAmount =
        booking.bookingType === "Hotel"
          ? await supabaseHotels.getHotelById(String(booking.listingId))
          : await supabaseTransports.getRideById(String(booking.listingId));
    }

    const listedAmount =
      booking.amount ||
      listingForAmount?.pricePerNight ||
      listingForAmount?.pricePerSeat ||
      0;

    if (!isValidMoney(listedAmount)) {
      return res.status(400).json({ success: false, message: "Invalid booking amount." });
    }

    const normalizedAmount = Number(listedAmount);

    const options = {
      amount: Math.round(normalizedAmount * 100),
      currency: booking.currency || "INR",
      receipt: String(bookingId),
      notes: {
        bookingId: String(bookingId),
        bookingType: String(booking.bookingType || ""),
        userId: String(booking.userId || ""),
      },
    };

    const order = await razorpay.orders.create(options);
        
    // save orderId in booking
    if (isSupabase) {
      await supabaseBookings.updateBookingById(String(bookingId), {
        orderId: order.id,
        paymentStatus: "pending",
      });
    } else {
      await Booking.findByIdAndUpdate(
        bookingId,
        { orderId: order.id, paymentStatus: "pending" },
        { new: true }
      );
    }

    return res.json({
      success: true,
      order,
      amount: normalizedAmount,
      currency: booking.currency || "INR",
      bookingId: String(booking._id),
      customerName: booking.customerName || "",
      customerContact: booking.phoneNumber || "",
      customerEmail: req.user?.email || "",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};




// VERIFY PAYMENT
exports.verifyPayment = async (req, res) => {
  try {
    const {
      bookingId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = req.body || {};

    if (!bookingId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Incomplete payment verification payload." });
    }

    const isSupabase = getDataStore() === "supabase";
    const booking = isSupabase
      ? await supabaseBookings.getBookingById(String(bookingId))
      : await Booking.findById(bookingId);

    if (!booking || booking.orderId !== razorpay_order_id) {
      return res.status(400).json({ success: false, message: "Order mismatch." });
    }

    const actorId = String(req.user?.id || req.user?._id || "");
    if (actorId && String(booking.userId || "") !== actorId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (booking.paymentStatus === "paid") {
      return res.json({ success: true });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    if (!secret) {
      return res.status(500).json({ success: false, message: "Razorpay secret is not configured." });
    }

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      if (isSupabase) {
        await supabaseBookings.updateBookingById(String(bookingId), {
          paymentStatus: "failed",
          paymentId: razorpay_payment_id,
        });
      } else {
        booking.paymentStatus = "failed";
        booking.paymentId = razorpay_payment_id;
        await booking.save();
      }
      return res.status(400).json({ success: false, message: "Invalid payment signature." });
    }

    if (booking.bookingType === "Transport") {
      const seatsRequested = Math.max(1, Number(booking.guests || 1));
      const ride = isSupabase
        ? await supabaseTransports.getRideById(String(booking.listingId))
        : await Transport.findById(booking.listingId);
      if (!ride || ride.seatsAvailable < seatsRequested) {
        return res.status(400).json({
          success: false,
          message: "Selected ride is no longer available.",
        });
      }
      if (isSupabase) {
        await supabaseTransports.updateTransport({
          ownerId: String(ride.owner || ""),
          id: String(booking.listingId),
          updateFields: { seatsAvailable: Number(ride.seatsAvailable) - seatsRequested },
        });
      } else {
        ride.seatsAvailable -= seatsRequested;
        await ride.save();
      }
    }

    if (booking.bookingType === "Hotel") {
      const roomsRequested = Math.max(1, Number(booking.rooms || 1));
      const hotel = isSupabase
        ? await supabaseHotels.getHotelById(String(booking.listingId))
        : await Hotel.findById(booking.listingId);
      if (!hotel || hotel.roomsAvailable < roomsRequested) {
        return res.status(400).json({
          success: false,
          message: "Selected stay is no longer available.",
        });
      }
      if (isSupabase) {
        await supabaseHotels.updateHotel({
          ownerId: String(hotel.owner || ""),
          id: String(booking.listingId),
          updateData: { roomsAvailable: Number(hotel.roomsAvailable) - roomsRequested },
        });
      } else {
        hotel.roomsAvailable -= roomsRequested;
        await hotel.save();
      }
    }

    if (isSupabase) {
      await supabaseBookings.updateBookingById(String(bookingId), {
        paymentId: razorpay_payment_id,
        paymentStatus: "paid",
        status: "pending",
      });
    } else {
      booking.paymentId = razorpay_payment_id;
      booking.paymentStatus = "paid";
      booking.status = "pending";
      await booking.save();
    }

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
    res.status(500).json({ success: false, message: error.message || "Payment verification failed." });
  }
};
