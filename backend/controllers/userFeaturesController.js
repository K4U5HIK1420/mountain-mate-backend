const User = require("../models/User");
const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const Transport = require("../models/Transport");

// Wishlist
exports.getWishlist = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  return res.json({ success: true, wishlist: user.wishlist || [] });
};

exports.toggleWishlist = async (req, res) => {
  const { itemType, itemId } = req.body || {};
  if (!itemType || !itemId) {
    return res.status(400).json({ success: false, message: "itemType and itemId required" });
  }

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const idx = (user.wishlist || []).findIndex(
    (w) => String(w.itemType) === String(itemType) && String(w.itemId) === String(itemId)
  );

  if (idx >= 0) user.wishlist.splice(idx, 1);
  else user.wishlist.push({ itemType, itemId });

  await user.save();
  return res.json({ success: true, wishlist: user.wishlist });
};

// Populated wishlist items (Hotels + Transports)
exports.getWishlistItems = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  const wishlist = user.wishlist || [];

  const hotelIds = wishlist.filter((w) => w.itemType === "Hotel").map((w) => w.itemId);
  const rideIds = wishlist.filter((w) => w.itemType === "Transport").map((w) => w.itemId);

  const [hotels, rides] = await Promise.all([
    hotelIds.length ? Hotel.find({ _id: { $in: hotelIds } }) : [],
    rideIds.length ? Transport.find({ _id: { $in: rideIds } }) : [],
  ]);

  const hotelMap = new Map(hotels.map((h) => [String(h._id), h]));
  const rideMap = new Map(rides.map((r) => [String(r._id), r]));

  const items = wishlist
    .map((w) => {
      const obj = w.itemType === "Hotel" ? hotelMap.get(String(w.itemId)) : rideMap.get(String(w.itemId));
      if (!obj) return null;
      return { itemType: w.itemType, item: obj };
    })
    .filter(Boolean);

  return res.json({ success: true, data: items });
};

// Booking history (JWT users)
exports.getMyBookings = async (req, res) => {
  const bookings = await Booking.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .populate("listingId");
  return res.json({ success: true, data: bookings });
};

