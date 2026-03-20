const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  avatarUrl: {
    type: String,
    default: ""
  },

  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },

  wishlist: [
    {
      itemType: { type: String, enum: ["Hotel", "Transport"], required: true },
      itemId: { type: mongoose.Schema.Types.ObjectId, required: true }
    }
  ],

  referrals: {
    code: { type: String, default: "" },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    invitedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },

  passwordResetTokenHash: {
    type: String,
    default: ""
  },
  passwordResetExpiresAt: {
    type: Date,
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);