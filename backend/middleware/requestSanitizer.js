const MAX_STRING_LENGTH = 5000;
const MAX_DEPTH = 8;

function sanitizeString(value) {
  return value.replace(/\0/g, "").trim();
}

function containsForbiddenKey(obj = {}) {
  return Object.keys(obj).some((key) => key.startsWith("$") || key.includes("."));
}

function sanitizeValue(value, depth = 0) {
  if (depth > MAX_DEPTH) {
    throw new Error("Payload nesting is too deep.");
  }

  if (typeof value === "string") {
    const sanitized = sanitizeString(value);
    if (sanitized.length > MAX_STRING_LENGTH) {
      throw new Error("Input is too long.");
    }
    return sanitized;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  if (value && typeof value === "object") {
    if (containsForbiddenKey(value)) {
      throw new Error("Payload contains forbidden keys.");
    }

    return Object.entries(value).reduce((acc, [key, nestedValue]) => {
      acc[key] = sanitizeValue(nestedValue, depth + 1);
      return acc;
    }, {});
  }

  return value;
}

module.exports = function requestSanitizer(req, res, next) {
  try {
    if (req.body && typeof req.body === "object") {
      req.body = sanitizeValue(req.body);
    }

    if (req.query && typeof req.query === "object") {
      req.query = sanitizeValue(req.query);
    }

    if (req.params && typeof req.params === "object") {
      req.params = sanitizeValue(req.params);
    }

    return next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Invalid request payload.",
    });
  }
};
