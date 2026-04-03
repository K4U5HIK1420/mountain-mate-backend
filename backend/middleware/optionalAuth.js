const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const { getSupabaseClient } = require("../utils/supabaseClient");
const { getDataStore } = require("../utils/dataStore");

function canUseMongoAuth() {
  return getDataStore() === "mongo" && mongoose.connection.readyState === 1;
}

module.exports = async (req, _res, next) => {
  const authHeader = req.headers["authorization"] || "";
  if (!authHeader.startsWith("Bearer ")) return next();

  const token = authHeader.split(" ")[1];

  if (canUseMongoAuth()) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id || decoded._id).select("-password");
      req.user = user || decoded;
      return next();
    } catch (_legacyErr) {
      // Fall through to Supabase auth.
    }
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data?.user) {
      const u = data.user;
      req.user = {
        id: u.id,
        email: u.email,
        app_metadata: u.app_metadata,
        user_metadata: u.user_metadata,
        role: u.app_metadata?.role || u.user_metadata?.role || null,
        supabase_user: u,
      };
    }
    return next();
  } catch (_supabaseErr) {
    return next();
  }
};

