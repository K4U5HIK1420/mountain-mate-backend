const mongoose = require("mongoose");

const wishlistItemSchema = new mongoose.Schema(
  {
    itemType: { type: String, enum: ["Hotel", "Transport"], required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { _id: false }
);

const userMetaSchema = new mongoose.Schema(
  {
    // Supabase auth.users.id (UUID string)
    userId: { type: String, required: true, unique: true, index: true },
    email: { type: String, default: "" },
    displayName: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },

    wishlist: { type: [wishlistItemSchema], default: [] },

    referral: {
      code: { type: String, default: "" },
      invitedBy: { type: String, default: "" }, // inviter Supabase userId
      invitedUsers: { type: [String], default: [] }, // invitee Supabase userIds
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserMeta", userMetaSchema);

