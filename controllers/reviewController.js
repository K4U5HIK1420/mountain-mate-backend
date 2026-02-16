const Review = require("../models/Review");

exports.addReview = async (req, res) => {
  try {
    const review = new Review(req.body);
    await review.save();

    res.json({
      success: true,
      message: "Review added successfully",
      data: review
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getHotelReviews = async (req, res) => {
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
    res.status(500).json({ message: error.message });
  }
};

const Hotel = require("../models/Hotel");

exports.getTopRatedHotels = async (req, res) => {
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
    res.status(500).json({ message: error.message });
  }
};
