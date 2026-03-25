const User = require("../models/User");
const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const Transport = require("../models/Transport");

// --- 🏔️ PROFILE SETUP ---
exports.setupProfile = async (req, res) => {
  try {
    const { fullName, phone, avatarUrl } = req.body;
    const supabaseUser = req.user; 

    let user = await User.findOne({ email: supabaseUser.email });

    if (user) {
      user.fullName = fullName || user.fullName;
      user.phone = phone || user.phone;
      user.avatarUrl = avatarUrl || user.avatarUrl;
      await user.save();
    } else {
      user = await User.create({
        email: supabaseUser.email,
        fullName,
        phone,
        avatarUrl,
        referrals: {
          code: `MM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          invitedUsers: [],
          credits: 0
        }
      });
    }
    res.json({ success: true, message: "Profile Synchronized!", user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Profile sync failed" });
  }
};

// --- 🏔️ BOOKINGS LOGIC (USER + PARTNER ROLE BASED) ---

// 1. User View: Mene kahan booking ki hai?
exports.getMyBookings = async (req, res) => {
  try {
    const data = await Booking.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("hotelId transportId");
    
    res.json({ success: true, data: data || [] });
  } catch (err) { 
    res.status(500).json({ success: false, message: "Failed to fetch your expeditions" }); 
  }
};

// 2. Partner View: Mere hotel/ride pe kisne booking ki hai?
exports.getPartnerIncomingBookings = async (req, res) => {
  try {
    // Partner ke apne listed items dhundo
    const [myHotels, myRides] = await Promise.all([
      Hotel.find({ owner: req.user._id }).select("_id"),
      Transport.find({ owner: req.user._id }).select("_id")
    ]);

    const hotelIds = myHotels.map(h => h._id);
    const rideIds = myRides.map(r => r._id);

    // Un items pe aayi hui saari bookings nikal lo
    const incoming = await Booking.find({
      $or: [
        { hotelId: { $in: hotelIds } },
        { transportId: { $in: rideIds } }
      ]
    })
    .populate("user", "fullName email phone") // Kisne book kiya uski detail
    .populate("hotelId transportId")
    .sort({ createdAt: -1 });

    res.json({ success: true, data: incoming || [] });
  } catch (err) {
    console.error("Partner Booking Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch incoming requests" });
  }
};

// 3. Action: Partner booking confirm/cancel karega
exports.updateBookingStatus = async (req, res) => {
  try {
    const { bookingId, status } = req.body; // status: 'Confirmed' or 'Cancelled'
    
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    // Security check: Kya ye booking isi partner ke item ki hai?
    // (Optional but good for security)

    booking.status = status;
    await booking.save();

    res.json({ success: true, message: `Booking status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: "Status update failed" });
  }
};

// --- 🏔️ REFERRAL SYSTEM ---
exports.getReferralStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "Explorer not found" });

    res.json({
      success: true,
      data: {
        code: user.referrals?.code || "MM-UPDATING",
        referralCount: user.referrals?.invitedUsers?.length || 0,
        credits: user.referrals?.credits || 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Uplink Error" });
  }
};

exports.redeemCode = async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ success: false, message: "Code required" });

  try {
    const currentUser = await User.findById(req.user._id);
    const inputCode = code.trim().toUpperCase();

    if (!currentUser.referrals) currentUser.referrals = { invitedUsers: [], credits: 0, hasRedeemed: false };
    if (currentUser.referrals.hasRedeemed) return res.status(400).json({ success: false, message: "Already redeemed!" });
    if (currentUser.referrals.code === inputCode) return res.status(400).json({ success: false, message: "Self-redeem not allowed" });

    const referrer = await User.findOne({ "referrals.code": inputCode });
    if (!referrer) return res.status(404).json({ success: false, message: "Invalid code" });

    currentUser.referrals.credits += 100;
    currentUser.referrals.hasRedeemed = true;
    
    if (!referrer.referrals) referrer.referrals = { invitedUsers: [], credits: 0 };
    referrer.referrals.credits += 50;
    referrer.referrals.invitedUsers.push(currentUser._id);

    await Promise.all([currentUser.save(), referrer.save()]);
    res.json({ success: true, message: "Credits added successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Redemption Failed" });
  }
};

// --- 🏔️ WISHLIST LOGIC ---
exports.getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, wishlist: user?.wishlist || [] });
  } catch (err) { res.status(500).json({ success: false, message: "Wishlist fetch failed" }); }
};

exports.getWishlistItems = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const wishlist = user?.wishlist || [];
    if (wishlist.length === 0) return res.json({ success: true, data: [] });

    const hotelIds = wishlist.filter(w => w.itemType === "Hotel").map(w => w.itemId);
    const rideIds = wishlist.filter(w => w.itemType === "Transport").map(w => w.itemId);

    const [hotels, rides] = await Promise.all([
      Hotel.find({ _id: { $in: hotelIds } }),
      Transport.find({ _id: { $in: rideIds } })
    ]);

    const items = wishlist.map(w => {
      const item = w.itemType === "Hotel" 
        ? hotels.find(h => h._id.toString() === w.itemId.toString())
        : rides.find(r => r._id.toString() === w.itemId.toString());
      return item ? { itemType: w.itemType, item } : null;
    }).filter(Boolean);

    res.json({ success: true, data: items });
  } catch (err) { res.status(500).json({ success: false, message: "Item sync failed" }); }
};

exports.toggleWishlist = async (req, res) => {
  try {
    const { itemType, itemId } = req.body;
    const user = await User.findById(req.user._id);
    if (!user.wishlist) user.wishlist = [];

    const idx = user.wishlist.findIndex(w => String(w.itemId) === String(itemId));
    if (idx >= 0) user.wishlist.splice(idx, 1);
    else user.wishlist.push({ itemType, itemId });

    await user.save();
    res.json({ success: true, wishlist: user.wishlist });
  } catch (err) { res.status(500).json({ success: false, message: "Toggle failed" }); }
};