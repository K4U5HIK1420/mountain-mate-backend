const { getSupabaseClient } = require("../utils/supabaseClient");

function extractBearerToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

/**
 * Validates Supabase Auth JWT by calling Supabase Auth.
 * Sets:
 * - req.user: { id, email, role, app_metadata, user_metadata, ...claims }
 */
async function supabaseAuth(req, res, next) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Missing Bearer token.",
      });
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

    return next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid session.",
    });
  }
}

function requireRole(...roles) {
  const allowed = new Set(roles);
  return (req, res, next) => {
    const role =
      req.user?.app_metadata?.role ||
      req.user?.user_metadata?.role ||
      req.user?.role;

    if (!role || !allowed.has(role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden.",
      });
    }
    next();
  };
}

module.exports = { supabaseAuth, requireRole };

