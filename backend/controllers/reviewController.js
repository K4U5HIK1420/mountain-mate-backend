const Review = require("../models/Review");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const { resolveAppUser } = require("../utils/resolveAppUser");

exports.addReview = async (req, res, next) => {
  try {
    const user = await resolveAppUser(req).catch(() => null);
    const actorId = String(req.user?.id || req.user?._id || user?._id || "");
    if (!actorId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const { bookingId, rating, comment } = req.body || {};
    if (!bookingId || !rating || !comment) {
      return res.status(400).json({ success: false, message: "bookingId, rating, and comment are required" });
    }

    const booking = await Booking.findById(bookingId).populate("listingId");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (String(booking.userId || "") !== actorId) {
      return res.status(403).json({ success: false, message: "You can only review your own booking" });
    }

    const stayCheckoutPassed =
      booking.bookingType === "Hotel" &&
      booking.endDate &&
      new Date(booking.endDate).getTime() <= Date.now();

    const rideCompleted = booking.bookingType === "Transport" && booking.status === "completed";
    const stayCompleted = booking.bookingType === "Hotel" && (booking.status === "completed" || stayCheckoutPassed);

    if (!rideCompleted && !stayCompleted) {
      return res.status(400).json({ success: false, message: "Review is only available after completion or checkout" });
    }

    const existing = await Review.findOne({ bookingId: booking._id });
    if (existing) {
      return res.status(400).json({ success: false, message: "You have already reviewed this booking" });
    }

    const review = new Review({
      bookingId: booking._id,
      userId: actorId,
      listingType: booking.bookingType,
      listingId: booking.listingId?._id || booking.listingId,
      hotelId: booking.bookingType === "Hotel" ? (booking.listingId?._id || booking.listingId) : null,
      transportId: booking.bookingType === "Transport" ? (booking.listingId?._id || booking.listingId) : null,
      customerName: booking.customerName || user?.name || req.user?.email,
      rating: Number(rating),
      comment: String(comment).trim(),
    });
    await review.save();

    res.json({
      success: true,
      message: "Review added successfully",
      data: review
    });
  } catch (error) {
    next(error);
  }
};


exports.getHotelReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ hotelId: req.params.hotelId }).sort({ createdAt: -1 });

    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1);

    res.json({
      success: true,
      averageRating: avgRating.toFixed(1),
      totalReviews: reviews.length,
      reviews
    });

  } catch (error) {
    next(error);
  }
};

const Hotel = require("../models/Hotel");

exports.getTopRatedHotels = async (req, res, next) => {
  try {
    const hotels = await Review.aggregate([
      { $match: { hotelId: { $ne: null } } },
      {
        $group: {
          _id: "$hotelId",
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 }
        }
      },
      { $sort: { avgRating: -1 } },
      { $limit: 5 }
    ]);

    const populatedHotels = await Hotel.populate(hotels, {
      path: "_id"
    });

    res.json({
      success: true,
      topHotels: populatedHotels
    });

  } catch (error) {
    next(error);  
    }
};

// Ratings summary for many hotels in one call
// GET /api/review/summary?ids=comma,separated,hotelIds
exports.getRatingsSummary = async (req, res, next) => {
  try {
    const idsRaw = String(req.query.ids || "").trim();
    const ids = idsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      return res.json({ success: true, data: {} });
    }

    const objectIds = ids
      .filter((id) => mongoose.isValidObjectId(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (objectIds.length === 0) {
      return res.json({ success: true, data: {} });
    }

    const agg = await Review.aggregate([
      { $match: { hotelId: { $in: objectIds } } },
      { $group: { _id: "$hotelId", avgRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } },
    ]);

    const out = {};
    for (const r of agg) {
      out[String(r._id)] = {
        avgRating: Number((r.avgRating || 0).toFixed(1)),
        totalReviews: r.totalReviews || 0,
      };
    }

    return res.json({ success: true, data: out });
  } catch (err) {
    next(err);
  }
};

exports.getMyReviewStatus = async (req, res, next) => {
  try {
    const actorId = String(req.user?.id || req.user?._id || "");
    if (!actorId) return res.status(401).json({ success: false, message: "Authentication required" });

    const bookingIds = String(req.query.bookingIds || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .filter((id) => mongoose.isValidObjectId(id));

    if (bookingIds.length === 0) {
      return res.json({ success: true, data: {} });
    }

    const reviews = await Review.find({
      userId: actorId,
      bookingId: { $in: bookingIds },
    })
      .select("bookingId rating comment createdAt")
      .lean();

    const data = {};
    for (const review of reviews) {
      data[String(review.bookingId)] = {
        reviewed: true,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
      };
    }

    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
