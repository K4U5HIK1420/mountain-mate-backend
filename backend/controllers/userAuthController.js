const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createResetToken, sha256 } = require("../utils/tokens");
const crypto = require("crypto");

function makeReferralCode() {
  // short, shareable, reasonably unique
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role || "user", email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function safeUser(u) {
  return {
    _id: u._id,
    name: u.name,
    email: u.email,
    avatarUrl: u.avatarUrl || "",
    role: u.role || "user",
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

// Register User
exports.registerUser = async (req, res) => {
  try {

    const { name, email, password, referralCode } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let invitedBy = null;
    if (referralCode) {
      const inviter = await User.findOne({ "referrals.code": String(referralCode).trim().toUpperCase() });
      if (inviter) invitedBy = inviter._id;
    }

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: "user",
      referrals: {
        code: makeReferralCode(),
        invitedBy,
        invitedUsers: [],
      },
    });

    await user.save();

    if (invitedBy) {
      await User.findByIdAndUpdate(invitedBy, { $addToSet: { "referrals.invitedUsers": user._id } });
    }

    const token = signToken(user);
    res.status(201).json({ success: true, token, user: safeUser(user) });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Login User
exports.loginUser = async (req, res) => {
  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);
    res.json({ success: true, token, user: safeUser(user) });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get current user (JWT)
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  return res.json({ success: true, user: safeUser(user) });
};

// Update profile (JWT)
exports.updateMe = async (req, res) => {
  const { name, avatarUrl } = req.body || {};
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  if (typeof name === "string" && name.trim()) user.name = name.trim();
  if (typeof avatarUrl === "string") user.avatarUrl = avatarUrl;
  await user.save();
  return res.json({ success: true, user: safeUser(user) });
};

// Referral info (JWT)
exports.getReferral = async (req, res) => {
  const user = await User.findById(req.user.id).select("referrals name email");
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  return res.json({ success: true, data: user.referrals });
};

// Redeem referral after signup (JWT)
exports.redeemReferral = async (req, res) => {
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ success: false, message: "Code required" });

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  if (user.referrals?.invitedBy) {
    return res.status(400).json({ success: false, message: "Referral already set" });
  }

  const inviter = await User.findOne({ "referrals.code": String(code).trim().toUpperCase() });
  if (!inviter) return res.status(404).json({ success: false, message: "Invalid referral code" });
  if (String(inviter._id) === String(user._id)) {
    return res.status(400).json({ success: false, message: "You cannot refer yourself" });
  }

  user.referrals = user.referrals || {};
  user.referrals.invitedBy = inviter._id;
  if (!user.referrals.code) user.referrals.code = makeReferralCode();
  await user.save();

  await User.findByIdAndUpdate(inviter._id, { $addToSet: { "referrals.invitedUsers": user._id } });
  return res.json({ success: true });
};

// Forgot password (JWT users)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    // Always respond success to prevent user enumeration
    if (!user) return res.json({ success: true, message: "If the email exists, reset instructions were sent." });

    const { token, tokenHash } = createResetToken();
    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 mins
    await user.save();

    // TODO: email integration (SendGrid/Resend/etc). For now return token in dev only.
    const isDev = (process.env.NODE_ENV || "development") !== "production";
    return res.json({
      success: true,
      message: "If the email exists, reset instructions were sent.",
      ...(isDev ? { devResetToken: token } : {}),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to process request" });
  }
};

// Reset password (JWT users)
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: "Token and newPassword required" });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    const tokenHash = sha256(token);
    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ success: false, message: "Invalid or expired token" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetTokenHash = "";
    user.passwordResetExpiresAt = null;
    await user.save();

    const jwtToken = signToken(user);
    return res.json({ success: true, token: jwtToken, user: safeUser(user) });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to reset password" });
  }
};