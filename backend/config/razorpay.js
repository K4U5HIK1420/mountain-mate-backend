const Razorpay = require("razorpay");

console.log("DEBUG: Key ID is ->", process.env.RAZORPAY_KEY_ID);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_SPWWZzocaxs0Qs",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "faHcU6iqciFe95r8Wl4XHuvJ",
});

module.exports = razorpay;