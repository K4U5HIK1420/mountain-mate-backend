const crypto = require("crypto");

function sha256(input) {
  return crypto.createHash("sha256").update(String(input)).digest("hex");
}

function createResetToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256(token);
  return { token, tokenHash };
}

module.exports = { sha256, createResetToken };

