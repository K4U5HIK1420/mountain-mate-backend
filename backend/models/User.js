const mongoose = require("mongoose");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required for the expedition"],
    trim: true
  },

  email: {
    type: String,
    required: [true, "Email uplink is mandatory"],
    unique: true,
    lowercase: true
  },

  password: {
    type: String,
    required: true
  },

  avatarUrl: {
    type: String,
    default: ""
  },

  phone: {
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

  // --- UPGRADED REFERRAL SYSTEM ---
  referrals: {
    code: { 
      type: String, 
      unique: true, // Code unique hona chahiye
      uppercase: true 
    },
    credits: { 
      type: Number, 
      default: 0 // Real money/points system
    },
    hasRedeemed: { 
      type: Boolean, 
      default: false // Taki ek user baar-baar redeem na kare
    },
    invitedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      default: null 
    },
    invitedUsers: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    }]
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

// ✅ AUTO-GENERATE REFERRAL CODE BEFORE SAVING
userSchema.pre("save", function(next) {
  if (!this.referrals.code) {
    // Generates a random 6-character code like MM-A1B2
    const random = crypto.randomBytes(3).toString("hex").toUpperCase();
    this.referrals.code = `MM-${random}`;
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
