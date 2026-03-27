const path = require("path");
const cloudinary = require("cloudinary").v2;
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const http = require("http");
const { Server } = require("socket.io");
const Booking = require("./models/Booking");

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

const mapLocationPayload = (payload = {}) => {
  const lat = Number(payload.lat);
  const lng = Number(payload.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    lat,
    lng,
    heading: Number.isFinite(Number(payload.heading)) ? Number(payload.heading) : null,
    speed: Number.isFinite(Number(payload.speed)) ? Number(payload.speed) : null,
    accuracy: Number.isFinite(Number(payload.accuracy)) ? Number(payload.accuracy) : null,
    updatedAt: new Date(),
  };
};

io.on("connection", (socket) => {
  console.log(`🔌 SIGNAL: Explorer connected (${socket.id})`);

  socket.on("join:user", (userId) => {
    if (!userId) return;
    socket.join(`user:${String(userId)}`);
  });

  socket.on("join:booking", async ({ bookingId, userId }) => {
    try {
      if (!bookingId || !userId) return;

      const booking = await Booking.findById(bookingId).lean();
      if (!booking || booking.bookingType !== "Transport") return;

      const actorId = String(userId);
      const isParticipant =
        String(booking.userId || "") === actorId || String(booking.ownerId || "") === actorId;

      if (!isParticipant) return;

      socket.join(`booking:${String(bookingId)}`);
      socket.emit("tracking:snapshot", {
        bookingId: String(bookingId),
        liveTracking: booking.liveTracking || {},
      });
    } catch (_err) {
      // silent room join failure
    }
  });

  socket.on("driver-location-update", async (payload) => {
    try {
      const { bookingId, userId } = payload || {};
      const location = mapLocationPayload(payload);
      if (!bookingId || !userId || !location) return;

      const booking = await Booking.findById(bookingId);
      if (!booking || booking.bookingType !== "Transport") return;
      if (String(booking.ownerId || "") !== String(userId)) return;

      booking.liveTracking = {
        ...(booking.liveTracking || {}),
        driverLocation: location,
      };
      await booking.save();

      io.to(`booking:${String(bookingId)}`).emit("tracking:update", {
        bookingId: String(bookingId),
        role: "driver",
        location,
      });
    } catch (_err) {
      // silent update failure
    }
  });

  socket.on("user-location-update", async (payload) => {
    try {
      const { bookingId, userId } = payload || {};
      const location = mapLocationPayload(payload);
      if (!bookingId || !userId || !location) return;

      const booking = await Booking.findById(bookingId);
      if (!booking || booking.bookingType !== "Transport") return;
      if (String(booking.userId || "") !== String(userId)) return;

      booking.liveTracking = {
        ...(booking.liveTracking || {}),
        riderLocation: location,
      };
      await booking.save();

      io.to(`booking:${String(bookingId)}`).emit("tracking:update", {
        bookingId: String(bookingId),
        role: "rider",
        location,
      });
    } catch (_err) {
      // silent update failure
    }
  });

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
const notificationRoutes = require("./routes/notificationRoutes");

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
app.use("/api/notifications", notificationRoutes);

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
