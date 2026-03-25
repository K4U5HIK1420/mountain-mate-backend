const path = require("path");
const cloudinary = require("cloudinary").v2;
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const http = require("http");
const { Server } = require("socket.io");

// Custom Modules
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// Load Environment Variables
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

// 1. Initialize DB Connection
connectDB().then(() => {
  console.log("📂 DATABASE: Himalayan Database Connected.");
}).catch((err) => {
  console.error("❌ FATAL ERROR: Database connection failed!", err.message);
  process.exit(1);
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();
const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log(`🔌 SIGNAL: Explorer connected (${socket.id})`);

  socket.on("disconnect", () => {
    console.log(`🔌 SIGNAL: Explorer lost connection.`);
  });
});

// 2. Global Middlewares
app.use(cors());
app.use(express.json());

// 3. Rate Limiter (Tactical Security)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // Thoda increase kiya taaki development mein bar-bar block na ho
  message: {
    message: "Too many requests from this telemetry node, try again in 15 mins",
    status: 429
  }
});
app.use("/api/", limiter);

// 4. Route Imports
const authRoutes = require("./routes/authRoutes");
const hotelRoutes = require("./routes/hotelRoutes");
const transportRoutes = require("./routes/transportRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const userAuthRoutes = require("./routes/userAuthRoutes");
const userFeaturesRoutes = require("./routes/userFeaturesRoutes"); // Referral & Wishlist yahan hai
const tripRoutes = require("./routes/tripRoutes");
const adminRoutes = require("./routes/adminRoutes"); // Dashboard Stats yahan hai
const adminConsoleRoutes = require("./routes/adminConsoleRoutes");
const aiRoutes = require("./routes/aiRoutes");

// 5. Route Definitions
app.use("/api/auth", authRoutes);
app.use("/api/hotel", hotelRoutes);
app.use("/api/transport", transportRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/payment", paymentRoutes);

// ✅ Feature Routes (Unified)
app.use("/api/user", userAuthRoutes);
app.use("/api/user", userFeaturesRoutes); // Frontend calls like /api/user/referral will work!

app.use("/api/trips", tripRoutes);
app.use("/api/admin", adminRoutes); // Admin Dashboard: /api/admin/stats
app.use("/api/admin-console", adminConsoleRoutes);
app.use("/api/ai", aiRoutes);

// 6. Base Routes
app.get("/", (req, res) => {
  res.send("🏔️ Mountain-Mate Strategic Backend Running...");
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "UP",
    message: "Mountain-Mate API is online 🚀",
    timestamp: new Date().toISOString(),
    node_version: process.version
  });
});

// 7. Global Error Handler
app.use(errorHandler);

// --- START SERVER ---
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`--------------------------------------------------`);
  console.log(`🚀 STRATEGIC UPLINK ESTABLISHED ON PORT: ${PORT}`);
  console.log(`🛰️  HEALTH CHECK: http://localhost:${PORT}/api/health`);
  console.log(`📊 ADMIN DASHBOARD: http://localhost:${PORT}/api/admin/stats`);
  console.log(`--------------------------------------------------`);
});
