const Hotel = require("../models/Hotel");
const Review = require("../models/Review");

// "AI-inspired" recommendations (heuristics)
exports.getHotelRecommendations = async (req, res, next) => {
  try {
    const { location, maxPrice } = req.query;

    const match = { isVerified: true };
    if (location) match.location = { $regex: location, $options: "i" };
    if (maxPrice) match.pricePerNight = { $lte: Number(maxPrice) };

    // Aggregate avg rating from reviews, then join hotels
    const rated = await Review.aggregate([
      { $group: { _id: "$hotelId", avgRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } },
      { $sort: { avgRating: -1, totalReviews: -1 } },
      { $limit: 30 },
    ]);

    const ratedIds = rated.map((r) => r._id);

    const hotels = await Hotel.find({
      ...match,
      ...(ratedIds.length ? { _id: { $in: ratedIds } } : {}),
    }).limit(12);

    const scoreMap = new Map(rated.map((r) => [String(r._id), r]));

    const result = hotels
      .map((h) => {
        const s = scoreMap.get(String(h._id));
        return {
          hotel: h,
          avgRating: s ? Number(s.avgRating.toFixed(1)) : null,
          totalReviews: s ? s.totalReviews : 0,
          reason: s
            ? `Top rated (${Number(s.avgRating.toFixed(1))}★ from ${s.totalReviews})`
            : "Great value pick",
        };
      })
      .sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));

    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

