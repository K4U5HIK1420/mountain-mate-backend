const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const Transport = require("../models/Transport");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const { restoreBookingInventory } = require("../utils/bookingInventory");
const { createNotification } = require("../services/notificationService");
const { getDataStore } = require("../utils/dataStore");
const supabaseHotels = require("../services/supabaseHotelsStore");
const supabaseTransports = require("../services/supabaseTransportsStore");
const supabaseBookings = require("../services/supabaseBookingsStore");

function uploadFileToCloudinary(file, folder) {
  return cloudinary.uploader.upload(file.path, {
    folder,
    resource_type: "auto",
  });
}

function createManualPaymentPayload(body = {}) {
  return {
    method: "upi_qr",
    payeeName: "Anant Kaushik (MountainMateAdmin)",
    upiId: "anantkaushik2447-1@oksbi",
    transactionId: String(body.transactionId || "").trim(),
    note: String(body.note || "").trim(),
    screenshotUrl: String(body.screenshotUrl || ""),
    submittedAt: new Date(),
    reviewedAt: null,
    reviewedBy: "",
  };
}

function buildAdminPaymentEvent(booking) {
  const manualPayment = booking?.manualPayment || booking?.liveTracking?.manualPayment || null;
  const pricing = booking?.liveTracking?.pricing || null;
  return {
    bookingId: String(booking?._id || ""),
    customerName: booking?.customerName || "Customer",
    listingLabel: booking?.listingLabel || "Booking",
    amount: Number(booking?.amount || pricing?.totalAmount || 0),
    paymentStatus: booking?.paymentStatus || "pending",
    submittedAt: manualPayment?.submittedAt || booking?.updatedAt || new Date().toISOString(),
    transactionId: manualPayment?.transactionId || booking?.paymentId || "",
    screenshotUrl: manualPayment?.screenshotUrl || "",
  };
}

function resolveBookingPricing({ isHotel, listing, body = {} }) {
  const quantity = isHotel
    ? Math.max(1, Number(body.rooms || 1))
    : Math.max(1, Number(body.guests || 1));
  const unitPrice = Number(isHotel ? listing?.pricePerNight : listing?.pricePerSeat) || 0;
  const clientAmount = Number(body.amount || 0);
  const totalAmount = clientAmount > 0 ? clientAmount : unitPrice * quantity;

  return {
    quantity,
    unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
    totalAmount: Number.isFinite(totalAmount) ? totalAmount : 0,
  };
}

// Create Booking
exports.createBooking = async (req, res, next) => {
    try {
        const isHotel = req.body.bookingType === "Hotel";
        let listing = null;

        if (getDataStore() === "supabase") {
          listing = isHotel
            ? await supabaseHotels.getHotelById(String(req.body.listingId || ""))
            : await supabaseTransports.getRideById(String(req.body.listingId || ""));
        } else {
          const ListingModel = isHotel ? Hotel : Transport;
          listing = await ListingModel.findById(req.body.listingId).lean();
        }

        if (!listing) {
          return res.status(404).json({ success: false, message: "Listing not found" });
        }

        const ownerId = String(listing.owner || listing.ownerId || "");
        const listingLabel = isHotel
          ? listing.hotelName
          : `${listing.vehicleType || ""} ${listing.routeFrom || ""} - ${listing.routeTo || ""}`.trim();

        const pricing = resolveBookingPricing({ isHotel, listing, body: req.body });

        const bookingPayload = {
          ...req.body,
          listingId: String(req.body.listingId || ""),
          amount: pricing.totalAmount,
          userId: String(req.user?.id || req.user?._id || req.body.userId || ""),
          ownerId,
          listingLabel,
          liveTracking:
            req.body.bookingType === "Transport"
              ? {
                  status: "searching",
                  pricing: {
                    quantity: pricing.quantity,
                    unitPrice: pricing.unitPrice,
                    totalAmount: pricing.totalAmount,
                  },
                }
              : {
                  pricing: {
                    quantity: pricing.quantity,
                    unitPrice: pricing.unitPrice,
                    totalAmount: pricing.totalAmount,
                  },
                },
        };

        const booking =
          getDataStore() === "supabase"
            ? await supabaseBookings.createBooking(bookingPayload)
            : await new Booking(bookingPayload).save();

        try {
          await createNotification(
            {
              userId: booking.userId,
              title: "Booking created",
              message: `Your request for ${listingLabel} has been created. Complete payment to send it for approval.`,
              type: "system",
              data: { bookingId: String(booking._id), bookingType: booking.bookingType },
            },
            req.app.get("io")
          );

          await createNotification(
            {
              userId: booking.ownerId,
              title: "New booking started",
              message: `${booking.customerName} started a booking for ${listingLabel}. It will move to approval after payment.`,
              type: "booking_request",
              data: { bookingId: String(booking._id), bookingType: booking.bookingType, stage: "created" },
            },
            req.app.get("io")
          );
        } catch (_notificationErr) {
          // Do not fail booking creation if notification channel is unavailable.
        }

        res.status(201).json(booking);
    } catch (error) {
    next(error);
    }
};

exports.getTrackingBooking = async (req, res, next) => {
  try {
    const actorId = String(req.user?.id || req.user?._id || "");
    const booking = await Booking.findById(req.params.id).lean();

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const isParticipant =
      String(booking.userId || "") === actorId || String(booking.ownerId || "") === actorId;

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (booking.bookingType !== "Transport") {
      return res.status(400).json({ success: false, message: "Live tracking is only available for ride bookings" });
    }

    res.json({
      success: true,
      data: {
        ...booking,
        viewerRole: String(booking.ownerId || "") === actorId ? "driver" : "rider",
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.updateTrackingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const actorId = String(req.user?.id || req.user?._id || "");
    const normalizedStatus = String(status || "").toLowerCase();

    if (!["accepted", "on_the_way", "completed", "declined"].includes(normalizedStatus)) {
      return res.status(400).json({ success: false, message: "Invalid tracking status" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.bookingType !== "Transport") {
      return res.status(400).json({ success: false, message: "Tracking status only applies to rides" });
    }

    if (String(booking.ownerId || "") !== actorId) {
      return res.status(403).json({ success: false, message: "Only the driver can update tracking status" });
    }

    booking.liveTracking = {
      ...(booking.liveTracking || {}),
      status: normalizedStatus,
    };

    if (normalizedStatus === "declined") {
      if (booking.paymentStatus === "paid") {
        await restoreBookingInventory(booking);
      }
      booking.status = "declined";
    } else if (normalizedStatus === "completed") {
      booking.status = "completed";
    } else if (normalizedStatus === "accepted" && booking.status === "pending") {
      booking.status = "confirmed";
    }

    await booking.save();

    const io = req.app.get("io");
    if (io) {
      io.to(`booking:${String(booking._id)}`).emit("tracking:status", {
        bookingId: String(booking._id),
        status: normalizedStatus,
      });
    }

    await createNotification(
      {
        userId: booking.userId,
        title: "Ride status updated",
        message:
          normalizedStatus === "on_the_way"
            ? `Your driver is on the way for ${booking.listingLabel || "your ride"}.`
            : normalizedStatus === "declined"
              ? `Your ride for ${booking.listingLabel || "your trip"} was declined by the driver.`
            : normalizedStatus === "completed"
              ? `Your ride for ${booking.listingLabel || "your trip"} has been marked completed.`
              : `Your ride for ${booking.listingLabel || "your trip"} is accepted and live tracking is ready.`,
        type: "ride_tracking_status",
        data: { bookingId: String(booking._id), status: normalizedStatus },
      },
      io
    );

    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
};

// Get All Bookings
exports.getBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.find();
        res.json(bookings);
    } catch (error) {
        next(error);
    }
};

// Get single booking for the logged-in user (JWT)
exports.getMyBookingById = async (req, res, next) => {
  try {
    const ownerId = String(req.user?.id || req.user?._id || "");
    const booking =
      getDataStore() === "supabase"
        ? await supabaseBookings.getBookingByIdForUser(req.params.id, ownerId)
        : await Booking.findOne({ _id: req.params.id, userId: ownerId });
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

    const validStatuses = ["pending", "confirmed", "completed", "cancelled", "declined"];

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

    const validStatuses = ["pending", "confirmed", "completed", "cancelled", "declined"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const bookings = await Booking.find({ status })
      .lean();

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
    const ownerId = String(req.user?.id || req.user?._id || "");
    if (!booking.userId || String(booking.userId) !== ownerId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    if (booking.status === "cancelled") {
      return res.json({ success: true, message: "Already cancelled", data: booking });
    }
    if (booking.status === "completed" || booking.status === "declined") {
      return res.status(400).json({ success: false, message: "Completed bookings cannot be cancelled" });
    }

    if (booking.paymentStatus === "paid") {
      await restoreBookingInventory(booking);
    }

    booking.status = "cancelled";
    await booking.save();
    return res.json({ success: true, message: "Booking cancelled", data: booking });
  } catch (err) {
    next(err);
  }
};

exports.submitManualPaymentProof = async (req, res, next) => {
  try {
    const actorId = String(req.user?.id || req.user?._id || "");
    const isSupabase = getDataStore() === "supabase";
    const booking = isSupabase
      ? await supabaseBookings.getBookingById(req.params.id)
      : await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (String(booking.userId || "") !== actorId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (booking.paymentStatus === "paid") {
      return res.status(400).json({ success: false, message: "Booking is already marked paid." });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Payment screenshot is required." });
    }

    const uploaded = await uploadFileToCloudinary(req.file, "mountain_mate/payment_proofs");
    const manualPayment = createManualPaymentPayload({
      transactionId: req.body.transactionId,
      note: req.body.note,
      screenshotUrl: uploaded.secure_url,
    });

    let updatedBooking;
    if (isSupabase) {
      updatedBooking = await supabaseBookings.updateBookingById(String(booking._id), {
        paymentStatus: "under_review",
        paymentId: manualPayment.transactionId || booking.paymentId || "",
        liveTracking: {
          ...(booking.liveTracking || {}),
          manualPayment,
        },
      });
    } else {
      booking.paymentStatus = "under_review";
      booking.paymentId = manualPayment.transactionId || booking.paymentId || "";
      booking.manualPayment = manualPayment;
      await booking.save();
      updatedBooking = booking;
    }

    try {
      await createNotification(
        {
          userId: booking.userId,
          title: "Payment proof submitted",
          message: `Your payment proof for ${booking.listingLabel || "this booking"} is under admin review.`,
          type: "system",
          data: { bookingId: String(booking._id), bookingType: booking.bookingType, stage: "payment_under_review" },
        },
        req.app.get("io")
      );
    } catch (_notificationErr) {
      // Keep the payment flow alive even if notifications fail.
    }

    return res.json({
      success: true,
      message: "Payment proof submitted. Admin review is pending.",
      data: updatedBooking,
    });
  } catch (err) {
    next(err);
  } finally {
    if (req.app.get("io") && req.params.id) {
      try {
        const latestBooking = getDataStore() === "supabase"
          ? await supabaseBookings.getBookingById(req.params.id)
          : await Booking.findById(req.params.id).lean();
        if (latestBooking) {
          req.app.get("io").to("admin-payments").emit("payment:queue-updated", {
            type: "submitted",
            payment: buildAdminPaymentEvent(latestBooking),
          });
        }
      } catch (_eventErr) {
        // Payment submission should not fail because a live event could not be sent.
      }
    }
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
};
