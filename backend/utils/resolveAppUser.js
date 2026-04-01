const crypto = require("crypto");
const User = require("../models/User");

function getNameFromRequest(req) {
  const metadata = req.user?.user_metadata || {};
  return (
    metadata.full_name ||
    metadata.name ||
    req.user?.name ||
    req.user?.fullName ||
    (req.user?.email ? String(req.user.email).split("@")[0] : "Explorer")
  );
}

async function resolveAppUser(req, { createIfMissing = true } = {}) {
  if (req.user?._id && req.user?.email) {
    return req.user;
  }

  const email = String(req.user?.email || "")
    .trim()
    .toLowerCase();

  if (!email) return null;

  let user = await User.findOne({ email });
  if (!user && !createIfMissing) return null;

  if (!user) {
    user = await User.create({
      name: getNameFromRequest(req),
      email,
      password: crypto.randomBytes(24).toString("hex"),
      avatarUrl: req.user?.user_metadata?.avatar_url || "",
      role: req.user?.role === "admin" ? "admin" : "user",
    });
  } else {
    let changed = false;
    const nextName = getNameFromRequest(req);
    const nextAvatar = req.user?.user_metadata?.avatar_url || "";

    if (!user.name && nextName) {
      user.name = nextName;
      changed = true;
    }

    if (!user.avatarUrl && nextAvatar) {
      user.avatarUrl = nextAvatar;
      changed = true;
    }

    if (changed) {
      await user.save();
    }
  }

  return user;
}

module.exports = { resolveAppUser };
