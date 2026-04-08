const rateLimit = require("express-rate-limit");

function rateLimitMessage(message) {
  return {
    success: false,
    status: 429,
    message,
  };
}

function createLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json(rateLimitMessage(message));
    },
  });
}

const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many requests right now. Please slow down and try again shortly.",
});

const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many login or signup attempts. Please try again in 15 minutes.",
});

const supportLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  max: 25,
  message: "Support chat is temporarily busy. Please wait a bit before sending more messages.",
});

const aiLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  max: 15,
  message: "AI chat is temporarily rate limited. Please try again shortly.",
});

const bookingLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: "Too many booking requests. Please retry in a few minutes.",
});

module.exports = {
  apiLimiter,
  authLimiter,
  supportLimiter,
  aiLimiter,
  bookingLimiter,
};
