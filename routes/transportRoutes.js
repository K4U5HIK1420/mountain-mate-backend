const express = require("express");
const router = express.Router();
const { addTransport, getTransports, searchTransport } = require("../controllers/transportController");


router.post("/add", addTransport);
router.get("/all", getTransports);
router.get("/search", searchTransport);


module.exports = router;
