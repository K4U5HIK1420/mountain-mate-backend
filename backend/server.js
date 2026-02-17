require("dotenv").config();
const paymentRoutes = require("./routes/paymentRoutes");
const errorHandler = require("./middleware/errorHandler");
const reviewRoutes = require("./routes/reviewRoutes");
const authRoutes = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const hotelRoutes = require("./routes/hotelRoutes");
const transportRoutes = require("./routes/transportRoutes");
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many requests, try later"
});


const connectDB = require("./config/db");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/transport", transportRoutes);
app.use("/api/hotel", hotelRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/payment", paymentRoutes);
app.use(errorHandler);

app.use(limiter);

// Connect Database
connectDB();

// Test Route
app.get("/", (req, res) => {
    res.send("Pahadi Travel Backend Running 🚀");
});

const PORT = process.env.PORT || 5000;

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Mountain-Mate API is running 🚀",
  });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


