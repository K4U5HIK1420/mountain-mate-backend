const path = require("path");
const cloudinary = require("cloudinary").v2;
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

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

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

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

  socket.on("disconnect", () => {
    console.log("Signal: Explorer lost connection.");
  });
});

app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    message: "Too many requests from this telemetry node, try again in 15 mins",
    status: 429,
  },
});
app.use("/api/", limiter);

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
