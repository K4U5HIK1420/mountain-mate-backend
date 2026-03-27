const mongoose = require("mongoose");

const supportMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ["user", "ai", "admin"],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const supportConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      default: "",
    },
    userEmail: {
      type: String,
      default: "",
    },
    guestLabel: {
      type: String,
      default: "Explorer",
    },
    status: {
      type: String,
      enum: ["ai_resolved", "queued", "open", "resolved"],
      default: "ai_resolved",
    },
    handoffReason: {
      type: String,
      default: "",
    },
    lastUserMessage: {
      type: String,
      default: "",
    },
    lastAdminMessage: {
      type: String,
      default: "",
    },
    messages: {
      type: [supportMessageSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupportConversation", supportConversationSchema);
