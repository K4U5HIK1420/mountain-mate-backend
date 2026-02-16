const auth = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();
const { addTransport, getTransports, searchTransport } = require("../controllers/transportController");


router.post("/add", auth, addTransport);
router.get("/all", getTransports);
router.get("/search", searchTransport);


module.exports = router;
