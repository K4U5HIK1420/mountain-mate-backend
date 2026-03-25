const User = require("../models/User");
const Hotel = require("../models/Hotel");
const Booking = require("../models/Booking");
const Transport = require("../models/Transport");

// ✅ Dashboard Stats Logic
exports.stats = async (req, res) => {
  try {
    // 1. Parallel counts for efficiency
    const [userCount, hotelCount, transportCount, recentBookings] = await Promise.all([
      User.countDocuments(),
      Hotel.countDocuments(),
      Transport.countDocuments(),
      Booking.find().sort({ createdAt: -1 }).limit(7) // Graph ke liye pichle 7 entries
    ]);

    // 2. Total Revenue Calculation
    const revenueResult = await Booking.aggregate([
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]);

    // 3. Graph Data Formatting (Recharts compatible)
    const chartData = recentBookings.map((b, i) => ({
      name: b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-US', { weekday: 'short' }) : `Point ${i}`,
      bookings: b.totalPrice || 0
    })).reverse();

    res.status(200).json({
      users: userCount,
      revenue: revenueResult[0]?.total || 0,
      hotels: hotelCount,
      rides: transportCount,
      chartData: chartData.length > 0 ? chartData : [
        { name: 'Mon', bookings: 0 }, { name: 'Tue', bookings: 0 },
        { name: 'Wed', bookings: 0 }, { name: 'Thu', bookings: 0 },
        { name: 'Fri', bookings: 0 }, { name: 'Sat', bookings: 0 }, { name: 'Sun', bookings: 0 }
      ]
    });
  } catch (error) {
    res.status(500).json({ message: "Data sync failed", error: error.message });
  }
};