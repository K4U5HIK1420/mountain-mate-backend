const express = require("express");
const router = express.Router();

const {
  addReview,
  getHotelReviews,
  getTopRatedHotels,
  getRatingsSummary,
} = require("../controllers/reviewController");

router.post("/add", addReview);
router.get("/top-rated", getTopRatedHotels);
router.get("/summary", getRatingsSummary);
router.get("/:hotelId", getHotelReviews);


module.exports = router;
