const mongoose = require("mongoose");
const User = require("../models/User");
const { getSupabaseClient } = require("./supabaseClient");

async function resolveUserEmail(userId) {
  const id = String(userId || "").trim();
  if (!id) return "";

  if (mongoose.isValidObjectId(id)) {
    const user = await User.findById(id).select("email").lean();
    if (user?.email) return String(user.email).trim().toLowerCase();
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.admin.getUserById(id);
    if (!error && data?.user?.email) {
      return String(data.user.email).trim().toLowerCase();
    }
  } catch (_err) {
    // ignore and return empty
  }

  return "";
}

module.exports = { resolveUserEmail };

