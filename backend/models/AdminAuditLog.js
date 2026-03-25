const mongoose = require("mongoose");

const adminAuditLogSchema = new mongoose.Schema(
  {
    adminId: { type: String, default: "" },
    adminEmail: { type: String, default: "" },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: String, default: "" },
    summary: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminAuditLog", adminAuditLogSchema);
