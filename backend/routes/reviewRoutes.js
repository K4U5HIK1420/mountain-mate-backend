const express = require("express");
const router = express.Router();
const anyAuth = require("../middleware/anyAuth");

const {
  addReview,
  getHotelReviews,
  getTopRatedHotels,
  getRatingsSummary,
  getMyReviewStatus,
} = require("../controllers/reviewController");

router.post("/add", anyAuth, addReview);
router.get("/my-status", anyAuth, getMyReviewStatus);
router.get("/top-rated", getTopRatedHotels);
router.get("/summary", getRatingsSummary);
router.get("/:hotelId", getHotelReviews);


module.exports = router;
