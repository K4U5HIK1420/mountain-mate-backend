const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Admin = require("../models/Admin");
const User = require("../models/User");
const { getSupabaseClient } = require("../utils/supabaseClient");

function extractBearerToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

function normalizeRole(value) {
  return String(value || "").trim().toLowerCase();
}

function isAdminRole(value) {
  return normalizeRole(value) === "admin";
}

async function trySupabaseAuth(token) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;

  const u = data.user;
  const role = u.app_metadata?.role || u.user_metadata?.role || null;
  return {
    id: u.id,
    email: u.email,
    app_metadata: u.app_metadata,
    user_metadata: u.user_metadata,
    role,
    supabase_user: u,
  };
}

async function tryLegacyAuth(token) {
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (_err) {
    return null;
  }

  if (isAdminRole(decoded?.role)) {
    return {
      id: decoded.id || decoded._id || "",
      email: decoded.email || "",
      role: "admin",
      legacy_claims: decoded,
    };
  }

  if (mongoose.connection.readyState !== 1) return null;

  const id = decoded.id || decoded._id;
  if (!id) return null;

  const [user, admin] = await Promise.all([
    User.findById(id).select("-password").lean().catch(() => null),
    Admin.findById(id).select("-password").lean().catch(() => null),
  ]);

  if (isAdminRole(user?.role)) {
    return { ...user, id: String(user._id), role: "admin" };
  }
  if (admin) {
    return { ...admin, id: String(admin._id), role: "admin" };
  }

  return null;
}

module.exports = async function supportAdminAuth(req, res, next) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Missing Bearer token.",
      });
    }

    let authenticatedUser = null;

    try {
      authenticatedUser = await trySupabaseAuth(token);
    } catch (_err) {
      authenticatedUser = null;
    }

    if (!authenticatedUser) {
      authenticatedUser = await tryLegacyAuth(token);
    }

    if (!authenticatedUser) {
      return res.status(401).json({
        success: false,
        message: "Invalid session.",
      });
    }

    if (!isAdminRole(authenticatedUser.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden.",
      });
    }

    req.user = {
      ...authenticatedUser,
      role: "admin",
    };
    return next();
  } catch (_err) {
    return res.status(401).json({
      success: false,
      message: "Invalid session.",
    });
  }
};
