const Review = require("../models/Review");
const mongoose = require("mongoose");

exports.addReview = async (req, res, next) => {
  try {
    const review = new Review(req.body);
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
    const reviews = await Review.find({ hotelId: req.params.hotelId });

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
