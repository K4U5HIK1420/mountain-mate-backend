const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createResetToken, sha256 } = require("../utils/tokens");
const crypto = require("crypto");
const { resolveAppUser } = require("../utils/resolveAppUser");
const { getDataStore } = require("../utils/dataStore");
const { getSupabaseClient } = require("../utils/supabaseClient");

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
    if (getDataStore() === "supabase") {
      const { name, email, password } = req.body;
      const normalizedEmail = String(email || "").trim().toLowerCase();

      if (!name || !normalizedEmail || !password) {
        return res.status(400).json({ success: false, message: "Name, email, and password are required" });
      }

      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: String(name).trim(),
        },
      });

      if (error) {
        const message = /Database error (creating|saving) new user/i.test(error.message || "")
          ? "Supabase auth user creation is failing in the project database. Run supabase/auth_signup_fix.sql in the Supabase SQL Editor, then retry signup."
          : error.message;
        return res.status(400).json({ success: false, message });
      }

      return res.status(201).json({
        success: true,
        user: {
          id: data.user?.id,
          name: data.user?.user_metadata?.full_name || String(name).trim(),
          email: data.user?.email || normalizedEmail,
          role: data.user?.app_metadata?.role || "user",
        },
      });
    }


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
    if (getDataStore() === "supabase") {
      return res.status(400).json({
        success: false,
        message: "Use Supabase password login for this project.",
      });
    }


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
  const user = await resolveAppUser(req);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  return res.json({
    success: true,
    data: {
      code: user.referrals?.code || "MM-UPDATING",
      referralCount: user.referrals?.invitedUsers?.length || 0,
      credits: user.referrals?.credits || 0,
      hasRedeemed: !!user.referrals?.hasRedeemed,
    },
  });
};

// Redeem referral after signup (JWT)
exports.redeemReferral = async (req, res) => {
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ success: false, message: "Code required" });

  const user = await resolveAppUser(req);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  if (user.referrals?.hasRedeemed || user.referrals?.invitedBy) {
    return res.status(400).json({ success: false, message: "Referral already redeemed" });
  }

  const inviter = await User.findOne({ "referrals.code": String(code).trim().toUpperCase() });
  if (!inviter) return res.status(404).json({ success: false, message: "Invalid referral code" });
  if (String(inviter._id) === String(user._id)) {
    return res.status(400).json({ success: false, message: "You cannot refer yourself" });
  }

  user.referrals = user.referrals || {};
  user.referrals.invitedBy = inviter._id;
  user.referrals.hasRedeemed = true;
  user.referrals.credits = Number(user.referrals.credits || 0) + 100;
  if (!user.referrals.code) user.referrals.code = makeReferralCode();
  await user.save();

  await User.findByIdAndUpdate(inviter._id, {
    $addToSet: { "referrals.invitedUsers": user._id },
    $inc: { "referrals.credits": 50 },
  });

  return res.json({
    success: true,
    message: "Referral redeemed successfully",
    data: {
      code: user.referrals.code,
      referralCount: user.referrals?.invitedUsers?.length || 0,
      credits: user.referrals.credits,
      hasRedeemed: true,
    },
  });
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
