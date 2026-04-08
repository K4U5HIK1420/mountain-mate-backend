const path = require("path");
const cloudinary = require("cloudinary").v2;
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const Booking = require("./models/Booking");

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const requestSanitizer = require("./middleware/requestSanitizer");
const { apiLimiter } = require("./middleware/rateLimiters");

require("dotenv").config({ path: path.resolve(__dirname, ".env") });

connectDB()
  .then(() => {
    console.log("Database: Himalayan Database Connected.");
  })
  .catch((err) => {
    console.error("Fatal Error: Database connection failed!", err.message);
    process.exit(1);
  });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const server = http.createServer(app);

const parseAllowedOrigins = () => {
  const configured = String(process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const defaults = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
  ];

  return [...new Set([...defaults, ...configured])];
};

const allowedOrigins = parseAllowedOrigins();

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("CORS blocked for this origin"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
};

const io = new Server(server, {
  cors: corsOptions,
});

app.set("io", io);
app.use("/api/payment/webhook", express.raw({ type: "application/json" }));

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
  console.log(`Signal: Explorer connected (${socket.id})`);

  socket.on("support:join", (conversationId) => {
    if (conversationId) {
      socket.join(`support:${conversationId}`);
    }
  });

  socket.on("support:join-admin", () => {
    socket.join("support-admin");
  });

  socket.on("admin:join-payments", () => {
    socket.join("admin-payments");
  });

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
    console.log("Signal: Explorer lost connection.");
  });
});

app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(requestSanitizer);
app.use("/api/", apiLimiter);

const authRoutes = require("./routes/authRoutes");
const hotelRoutes = require("./routes/hotelRoutes");
const transportRoutes = require("./routes/transportRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const userAuthRoutes = require("./routes/userAuthRoutes");
const userFeaturesRoutes = require("./routes/userFeaturesRoutes");
const tripRoutes = require("./routes/tripRoutes");
const adminRoutes = require("./routes/adminRoutes");
const adminConsoleRoutes = require("./routes/adminConsoleRoutes");
const aiRoutes = require("./routes/aiRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const supportRoutes = require("./routes/supportRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/hotel", hotelRoutes);
app.use("/api/transport", transportRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/user", userAuthRoutes);
app.use("/api/user", userFeaturesRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin-console", adminConsoleRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/support", supportRoutes);

app.get("/", (_req, res) => {
  res.send("Mountain-Mate Strategic Backend Running...");
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "UP",
    message: "Mountain-Mate API is online",
    timestamp: new Date().toISOString(),
    node_version: process.version,
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("--------------------------------------------------");
  console.log(`Strategic Uplink established on port: ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Admin dashboard: http://localhost:${PORT}/api/admin/stats`);
  console.log("--------------------------------------------------");
});
