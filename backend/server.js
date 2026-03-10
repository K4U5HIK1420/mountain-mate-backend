const path = require("path");
// Explicitly point to the .env file in the current directory
require("dotenv").config({ path: path.resolve(__dirname, ".env") }); 

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

// --- CRITICAL ENV CHECK ---
// This will tell you IMMEDIATELY if the file isn't being read
if (!process.env.MONGO_URI) {
  console.error("❌ FATAL ERROR: MONGO_URI is not defined in .env file.");
  console.error("Current Directory:", __dirname);
  process.exit(1); 
}

// 1. Initialize DB Connection
connectDB();

const app = express();

// 2. Global Middlewares
app.use(cors());
app.use(express.json());

// 3. Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many requests, try later",
});
app.use("/api/", limiter);

// 4. Route Imports
const authRoutes = require("./routes/authRoutes");
const hotelRoutes = require("./routes/hotelRoutes");
const transportRoutes = require("./routes/transportRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

// 5. Route Definitions
app.use("/api/auth", authRoutes);
app.use("/api/hotel", hotelRoutes);
app.use("/api/transport", transportRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/payment", paymentRoutes);

// 6. Health & Base Routes
app.get("/", (req, res) => {
  res.send("Mountain-Mate Backend Running 🚀");
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Mountain-Mate API is running 🚀",
    timestamp: new Date().toISOString(),
  });
});

// 7. Error Handler (Must be last)
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});