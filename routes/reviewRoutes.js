const express = require("express");
const router = express.Router();

const {
  addReview,
  getHotelReviews,
  getTopRatedHotels
} = require("../controllers/reviewController");

router.post("/add", addReview);
router.get("/top-rated", getTopRatedHotels);
router.get("/:hotelId", getHotelReviews);


module.exports = router;
