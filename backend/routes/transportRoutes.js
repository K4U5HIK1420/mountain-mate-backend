const auth = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();
const { addTransport, getTransports, searchTransport } = require("../controllers/transportController");
const upload = require("../middleware/upload");

router.post("/add", auth, upload.array("images", 5), addTransport);
router.get("/all", getTransports);
router.get("/search", searchTransport);


module.exports = router;
