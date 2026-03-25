const Booking = require("../models/Booking");
const User = require("../models/User");
const Hotel = require("../models/Hotel");
const Transport = require("../models/Transport");

// 1. LIST ALL BOOKINGS (With Filters)
exports.listBookings = async (req, res, next) => {
  try {
    const { status } = req.query;
    const q = {};
    if (status) q.status = status;

    const data = await Booking.find(q)
      .sort({ createdAt: -1 })
      .populate("hotelId") // "listingId" ki jagah tere model ke hisaab se "hotelId"
      .populate("user", "name email");

    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// 2. UPDATE BOOKING STATUS
exports.updateBooking = async (req, res, next) => {
  try {
    const { status, paymentStatus } = req.body || {};
    const update = {};
    if (status) update.status = status;
    if (paymentStatus) update.paymentStatus = paymentStatus;

    const booking = await Booking.findByIdAndUpdate(
      req.params.id, 
      { $set: update }, 
      { new: true }
    ).populate("hotelId").populate("user", "name email");

    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    return res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
};

// 3. ✅ REAL-TIME DASHBOARD STATS (UPGRADED)
exports.stats = async (req, res, next) => {
  try {
    // Parallel processing for elite performance
    const [userCount, hotelCount, rideCount, bookings, revenueData] = await Promise.all([
      User.countDocuments(),
      Hotel.countDocuments(),
      Transport.countDocuments(),
      Booking.find().sort({ createdAt: -1 }).limit(7), // Last 7 bookings for graph
      Booking.aggregate([
        { $group: { _id: null, total: { $sum: "$totalPrice" } } }
      ])
    ]);

    // Format Chart Data for Recharts
    const chartData = bookings.map((b, i) => ({
      name: b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-US', { weekday: 'short' }) : `Day ${i + 1}`,
      bookings: b.totalPrice || 0
    })).reverse();

    // Agar chartData khali hai toh empty array na bhej kar neutral graph bhej rahe hain
    const finalChartData = chartData.length > 0 ? chartData : [
      { name: 'Mon', bookings: 0 }, { name: 'Tue', bookings: 0 }, 
      { name: 'Wed', bookings: 0 }, { name: 'Thu', bookings: 0 }, 
      { name: 'Fri', bookings: 0 }, { name: 'Sat', bookings: 0 }, { name: 'Sun', bookings: 0 }
    ];

    // ✅ Exactly wahi keys jo Dashboard.jsx expect kar raha hai
    return res.json({
      success: true,
      users: userCount,
      revenue: revenueData[0]?.total || 0,
      hotels: hotelCount,
      rides: rideCount,
      chartData: finalChartData
    });
  } catch (err) {
    console.error("Stats Extraction Error:", err);
    next(err);
  }
};