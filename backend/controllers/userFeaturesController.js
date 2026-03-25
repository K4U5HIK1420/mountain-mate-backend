const User = require("../models/User");
const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const Transport = require("../models/Transport");

// --- 🏔️ REFERRAL SYSTEM ---

exports.getReferralStats = async (req, res) => {
  try {
    // req.user._id middleware se aa raha hai
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "Explorer not found" });

    // ✅ Default values ensure kar rahe hain taaki frontend "REF-ERROR" na dikhaye
    res.json({
      success: true,
      data: {
        code: user.referrals?.code || "MM-UPDATING",
        referralCount: user.referrals?.invitedUsers?.length || 0,
        credits: user.referrals?.credits || 0
      }
    });
  } catch (err) {
    console.error("Referral Stats Error:", err);
    res.status(500).json({ success: false, message: "Uplink Error" });
  }
};

exports.redeemCode = async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ success: false, message: "Code required" });

  try {
    const currentUser = await User.findById(req.user._id);
    const inputCode = code.trim().toUpperCase();

    // 🛡️ Safety Check: Object initialization
    if (!currentUser.referrals) {
      currentUser.referrals = { invitedUsers: [], credits: 0, hasRedeemed: false };
    }

    if (currentUser.referrals.hasRedeemed) {
      return res.status(400).json({ success: false, message: "Tactical Voucher already deployed!" });
    }
    
    if (currentUser.referrals.code === inputCode) {
      return res.status(400).json({ success: false, message: "Cannot bootstrap your own code!" });
    }

    // Referrer ko search karo nested field mein
    const referrer = await User.findOne({ "referrals.code": inputCode });
    if (!referrer) return res.status(404).json({ success: false, message: "Invalid extraction code" });

    // 💰 Credits Logic
    currentUser.referrals.credits = (currentUser.referrals.credits || 0) + 100;
    currentUser.referrals.hasRedeemed = true;
    
    // Referrer update
    if (!referrer.referrals) referrer.referrals = { invitedUsers: [], credits: 0 };
    referrer.referrals.credits = (referrer.referrals.credits || 0) + 50;
    referrer.referrals.invitedUsers.push(currentUser._id);

    await Promise.all([currentUser.save(), referrer.save()]);

    res.json({ success: true, message: "Uplink Successful! Credits added." });
  } catch (err) {
    console.error("Redeem Error:", err);
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
    if (!itemType || !itemId) return res.status(400).json({ success: false, message: "Data missing" });

    const user = await User.findById(req.user._id);
    if (!user.wishlist) user.wishlist = [];

    const idx = user.wishlist.findIndex(w => String(w.itemId) === String(itemId));

    if (idx >= 0) user.wishlist.splice(idx, 1);
    else user.wishlist.push({ itemType, itemId });

    await user.save();
    res.json({ success: true, wishlist: user.wishlist });
  } catch (err) { res.status(500).json({ success: false, message: "Toggle failed" }); }
};

// --- 🏔️ BOOKINGS ---

exports.getMyBookings = async (req, res) => {
  try {
    const data = await Booking.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("hotelId transportId");
    
    // Dashboard compatibility fix: Agar data empty hai toh empty array bhej rahe hain
    res.json({ success: true, data: data || [] });
  } catch (err) { 
    console.error("Booking Fetch Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch expeditions" }); 
  }
};