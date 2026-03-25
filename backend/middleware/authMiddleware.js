const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    // 1. Check if Header exists and starts with Bearer
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        success: false, 
        message: "Access denied. Tactical uplink missing (No Token)." 
      });
    }

    // 2. Extract Token
    const token = authHeader.split(" ")[1];

    // 3. Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 🔍 DEBUG: Terminal mein check kar payload sahi aa raha hai ya nahi
    // console.log("📡 DECODED PAYLOAD:", decoded);

    // 4. ✅ DATABASE SYNC (Critical Fix)
    // .select("-password") security ke liye aur .lean() performance ke liye
    const user = await User.findById(decoded.id || decoded._id).select("-password");

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Explorer not found in Himalayan Database. Token might be stale." 
      });
    }

    // 5. Attach User Object to Request
    // Ab controller mein 'req.user.referrals.code' solid chalega
    req.user = user; 
    
    // Admin compatibility check
    if (user.role === 'admin') {
      req.admin = user;
    }

    next();
  } catch (error) {
    console.error("🔐 AUTH ERROR:", error.message);
    
    let msg = "Invalid session.";
    if (error.name === "TokenExpiredError") msg = "Session expired. Re-establish uplink.";
    if (error.name === "JsonWebTokenError") msg = "Tampered token detected. Access revoked.";

    return res.status(401).json({ 
      success: false, 
      message: msg 
    });
  }
};