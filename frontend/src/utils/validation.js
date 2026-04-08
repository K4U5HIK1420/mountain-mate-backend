const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9][0-9\s-]{9,14}$/;
const AADHAAR_RE = /^\d{12}$/;
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_RE = /^\d{9,18}$/;
const VEHICLE_RE = /^[A-Z]{2}[ -]?\d{1,2}[ -]?[A-Z]{1,3}[ -]?\d{4}$/i;

export const cleanValue = (value) => String(value ?? "").trim();
export const digitsOnly = (value) => cleanValue(value).replace(/\D+/g, "");

export const normalizeEmail = (value) => cleanValue(value).toLowerCase();
export const normalizePhone = (value) => cleanValue(value).replace(/[^\d+]/g, "");
export const normalizePan = (value) => cleanValue(value).toUpperCase();
export const normalizeIfsc = (value) => cleanValue(value).toUpperCase();
export const normalizeVehiclePlate = (value) => cleanValue(value).toUpperCase();

export const isValidEmail = (value) => EMAIL_RE.test(normalizeEmail(value));
export const isValidPhone = (value) => PHONE_RE.test(cleanValue(value));
export const isValidAadhaar = (value) => AADHAAR_RE.test(digitsOnly(value));
export const isValidPan = (value) => PAN_RE.test(normalizePan(value));
export const isValidIfsc = (value) => IFSC_RE.test(normalizeIfsc(value));
export const isValidBankAccount = (value) => ACCOUNT_RE.test(digitsOnly(value));
export const isValidVehiclePlate = (value) => VEHICLE_RE.test(normalizeVehiclePlate(value));

export const hasMinLength = (value, min) => cleanValue(value).length >= min;
