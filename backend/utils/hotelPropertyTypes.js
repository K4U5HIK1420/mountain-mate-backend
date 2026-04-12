const ALLOWED_PROPERTY_TYPES = ["Hotel", "Homestay", "Lodge", "Camp / Tent"];
const DEFAULT_PROPERTY_TYPE = "Hotel";

function normalizePropertyType(value) {
  const raw = String(value || "").trim();
  if (!raw) return DEFAULT_PROPERTY_TYPE;

  const match = ALLOWED_PROPERTY_TYPES.find(
    (item) => item.toLowerCase() === raw.toLowerCase()
  );

  return match || DEFAULT_PROPERTY_TYPE;
}

module.exports = {
  ALLOWED_PROPERTY_TYPES,
  DEFAULT_PROPERTY_TYPE,
  normalizePropertyType,
};
