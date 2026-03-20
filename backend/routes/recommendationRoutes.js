const express = require("express");
const router = express.Router();

const { getHotelRecommendations } = require("../controllers/recommendationController");

router.get("/hotels", getHotelRecommendations);

module.exports = router;

