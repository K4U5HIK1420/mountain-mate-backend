const express = require("express");
const router = express.Router();

const {
  addReview,
  getHotelReviews
} = require("../controllers/reviewController");

router.post("/add", addReview);
router.get("/:hotelId", getHotelReviews);

module.exports = router;
