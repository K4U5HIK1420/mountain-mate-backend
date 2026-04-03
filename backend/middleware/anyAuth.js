const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const { getSupabaseClient } = require("../utils/supabaseClient");
const { getDataStore } = require("../utils/dataStore");

function canUseMongoAuth() {
  return getDataStore() === "mongo" && mongoose.connection.readyState === 1;
}

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Missing Bearer token.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (canUseMongoAuth()) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id || decoded._id).select("-password");
        if (user) {
          req.user = user;
          req.authType = "legacy";
          return next();
        }
      } catch (_legacyErr) {
        // Fall through to Supabase validation.
      }
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        success: false,
        message: "Invalid session.",
      });
    }

    const u = data.user;
    req.user = {
      id: u.id,
      email: u.email,
      app_metadata: u.app_metadata,
      user_metadata: u.user_metadata,
      role: u.app_metadata?.role || u.user_metadata?.role || null,
      supabase_user: u,
    };
    req.authType = "supabase";
    return next();
  } catch (_err) {
    return res.status(401).json({
      success: false,
      message: "Invalid session.",
    });
  }
};
