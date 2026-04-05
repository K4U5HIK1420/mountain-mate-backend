const User = require("../models/User");
const UserMeta = require("../models/UserMeta");
const Hotel = require("../models/Hotel");
const Transport = require("../models/Transport");
const Booking = require("../models/Booking");
const Trip = require("../models/Trip");
const Review = require("../models/Review");
const AdminAuditLog = require("../models/AdminAuditLog");
const { getSupabaseClient } = require("../utils/supabaseClient");
const mongoose = require("mongoose");
const { getDataStore } = require("../utils/dataStore");
const supabaseHotels = require("../services/supabaseHotelsStore");
const supabaseTransports = require("../services/supabaseTransportsStore");
const supabaseBookings = require("../services/supabaseBookingsStore");
const { createNotification } = require("../services/notificationService");

const HOTEL_FIELDS = ["hotelName", "propertyType", "location", "landmark", "ownerName", "pricePerNight", "roomsAvailable", "guestsPerRoom", "availabilityStatus", "contactNumber", "description", "images", "amenities", "complianceDetails", "verificationDocuments", "owner", "status", "isVerified"];
const RIDE_FIELDS = ["vehicleModel", "vehicleType", "plateNumber", "routeFrom", "routeTo", "fromCoords", "toCoords", "pricePerSeat", "seatsAvailable", "driverName", "contactNumber", "images", "complianceDetails", "verificationDocuments", "owner", "status", "isVerified"];
const BOOKING_FIELDS = ["customerName", "phoneNumber", "status", "paymentStatus", "date", "startDate", "endDate", "guests", "rooms", "amount", "currency", "manualPayment"];
const TRIP_FIELDS = ["title", "status", "itinerary"];
const USER_META_FIELDS = ["email", "displayName", "avatarUrl", "wishlist", "referral"];
const PAYMENT_REVIEW_STATUSES = ["under_review", "paid", "failed"];
const RAW_COLLECTIONS = { users: User, userMeta: UserMeta, hotels: Hotel, rides: Transport, bookings: Booking, trips: Trip, reviews: Review, audit: AdminAuditLog };

const EXPORT_FETCHERS = {
  users: async () => (await exports.listUsersInternal({ q: "", page: 1, pageSize: 1000 })).rows,
  userMeta: async () => (await exports.listUserMetaInternal({ q: "", page: 1, pageSize: 1000 })).rows,
  hotels: async () => (await exports.listModelInternal(Hotel, { q: "", page: 1, pageSize: 1000 }, ["hotelName", "location", "contactNumber", "description"])).rows,
  rides: async () => (await exports.listModelInternal(Transport, { q: "", page: 1, pageSize: 1000 }, ["vehicleModel", "vehicleType", "routeFrom", "routeTo", "plateNumber", "driverName"])).rows,
  bookings: async () => (await exports.listBookingsInternal({ q: "", page: 1, pageSize: 1000 })).rows,
  payments: async () => (await exports.listPaymentsInternal({ q: "", page: 1, pageSize: 1000 })).rows,
  trips: async () => (await exports.listModelInternal(Trip, { q: "", page: 1, pageSize: 1000 }, ["title", "status", "userId"])).rows,
  reviews: async () => (await exports.listReviewsInternal({ q: "", page: 1, pageSize: 1000 })).rows,
  audit: async () => (await exports.listAuditLogsInternal({ q: "", page: 1, pageSize: 1000 })).rows,
};

function buildSearchRegex(q) {
  return q ? new RegExp(String(q).trim(), "i") : null;
}

function pickAllowed(body, allowed) {
  const update = {};
  for (const key of allowed) if (Object.prototype.hasOwnProperty.call(body, key)) update[key] = body[key];
  return update;
}

function normalizeRole(value) {
  if (!value) return null;
  return String(value).trim().toLowerCase();
}

function getRawModel(collection) {
  const model = RAW_COLLECTIONS[collection];
  if (!model) {
    const err = new Error("Unsupported collection");
    err.statusCode = 400;
    throw err;
  }
  return model;
}

function getPaging(req) {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 20, 1), 100);
  return { page, pageSize, skip: (page - 1) * pageSize };
}

function getSort(req, fallback = { sortBy: "updatedAt", sortDir: "desc" }) {
  return {
    sortBy: String(req.query.sortBy || fallback.sortBy),
    sortDir: String(req.query.sortDir || fallback.sortDir).toLowerCase() === "asc" ? "asc" : "desc",
  };
}

function paginateRows(rows, total, page, pageSize) {
  return {
    rows,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    },
  };
}

function rowId(value) {
  return String(value?.id || value?._id || "");
}

function toCsv(rows) {
  const keys = [...new Set(rows.flatMap((row) => Object.keys(row || {})))];
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const header = keys.map(escape).join(",");
  const lines = rows.map((row) => keys.map((key) => escape(typeof row[key] === "object" && row[key] !== null ? JSON.stringify(row[key]) : row[key])).join(","));
  return [header, ...lines].join("\n");
}

function isMongoReady() {
  return mongoose.connection.readyState === 1;
}

function isSupabaseStore() {
  return getDataStore() === "supabase";
}

async function safeFind(Model, query = {}, projection = null) {
  if (!isMongoReady()) return [];
  return Model.find(query, projection).lean();
}

async function safeCount(Model, query = {}) {
  if (!isMongoReady()) return 0;
  return Model.countDocuments(query);
}

async function logAdminAction(req, action, targetType, targetId, summary, metadata = null) {
  try {
    if (!isMongoReady()) return;
    await AdminAuditLog.create({
      adminId: req.user?.id || "",
      adminEmail: req.user?.email || "",
      action,
      targetType,
      targetId: targetId ? String(targetId) : "",
      summary,
      metadata,
    });
  } catch (_err) {
    // Logging should never block admin actions
  }
}

async function loadSupabaseUsers() {
  const supabase = getSupabaseClient();
  let page = 1;
  let done = false;
  const users = [];
  while (!done) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const batch = data?.users || [];
    users.push(...batch);
    done = batch.length < 200;
    page += 1;
  }
  return users;
}

async function countMap(Model, field) {
  if (!isMongoReady()) return new Map();
  const rows = await Model.aggregate([{ $group: { _id: `$${field}`, count: { $sum: 1 } } }]);
  return new Map(rows.map((item) => [String(item._id || ""), item.count]));
}

exports.listModelInternal = async (Model, { q, page, pageSize, status, sortBy = "updatedAt", sortDir = "desc" }, searchFields) => {
  if (!isMongoReady()) return paginateRows([], 0, page, pageSize);
  const regex = buildSearchRegex(q);
  const query = regex ? { $or: searchFields.map((field) => ({ [field]: regex })) } : {};
  if (status) query.status = status;
  const direction = sortDir === "asc" ? 1 : -1;
  const sort = { [sortBy]: direction, createdAt: -1 };
  const [rows, total] = await Promise.all([
    Model.find(query).sort(sort).skip((page - 1) * pageSize).limit(pageSize).lean(),
    Model.countDocuments(query),
  ]);
  return paginateRows(rows, total, page, pageSize);
};

exports.listUsersInternal = async ({ q, page, pageSize, role, sortBy = "createdAt", sortDir = "desc" }) => {
  const regex = buildSearchRegex(q);
  const [supabaseUsers, userMetas, legacyUsers, hotelCounts, rideCounts, bookingCounts, tripCounts] = await Promise.all([
    loadSupabaseUsers(),
    safeFind(UserMeta),
    safeFind(User),
    countMap(Hotel, "owner"),
    countMap(Transport, "owner"),
    countMap(Booking, "userId"),
    countMap(Trip, "userId"),
  ]);

  const metaByUserId = new Map(userMetas.map((item) => [item.userId, item]));
  const legacyByEmail = new Map(legacyUsers.map((item) => [String(item.email || "").toLowerCase(), item]));

  const allRows = supabaseUsers
    .map((user) => {
      const email = String(user.email || "");
      const meta = metaByUserId.get(user.id);
      const legacy = legacyByEmail.get(email.toLowerCase());
      return {
        id: user.id,
        email,
        role: user.app_metadata?.role || user.user_metadata?.role || legacy?.role || "user",
        displayName: user.user_metadata?.full_name || user.user_metadata?.display_name || meta?.displayName || legacy?.name || "",
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
        emailConfirmedAt: user.email_confirmed_at,
        bannedUntil: user.banned_until || null,
        avatarUrl: meta?.avatarUrl || user.user_metadata?.avatar_url || legacy?.avatarUrl || "",
        activity: {
          hotels: hotelCounts.get(user.id) || 0,
          rides: rideCounts.get(user.id) || 0,
          bookings: bookingCounts.get(user.id) || 0,
          trips: tripCounts.get(user.id) || 0,
        },
        userMeta: meta || null,
        authUser: {
          app_metadata: user.app_metadata || {},
          user_metadata: user.user_metadata || {},
        },
      };
      })
      .filter((item) => (!regex || regex.test(item.email) || regex.test(item.displayName) || regex.test(item.id) || regex.test(item.role)) && (!role || item.role === role));

  const direction = sortDir === "asc" ? 1 : -1;
  allRows.sort((a, b) => {
    const av = a[sortBy] ?? "";
    const bv = b[sortBy] ?? "";
    return av > bv ? direction : av < bv ? -direction : 0;
  });

  const start = (page - 1) * pageSize;
  return paginateRows(allRows.slice(start, start + pageSize), allRows.length, page, pageSize);
};

exports.listUserMetaInternal = async ({ q, page, pageSize, sortBy = "updatedAt", sortDir = "desc" }) => {
  if (!isMongoReady()) return paginateRows([], 0, page, pageSize);
  const regex = buildSearchRegex(q);
  const query = regex ? { $or: [{ email: regex }, { displayName: regex }, { userId: regex }, { "referral.code": regex }] } : {};
  const direction = sortDir === "asc" ? 1 : -1;
  const [rows, total] = await Promise.all([
    UserMeta.find(query).sort({ [sortBy]: direction, updatedAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    UserMeta.countDocuments(query),
  ]);
  return paginateRows(rows.map((row) => ({ ...row, wishlistCount: row.wishlist?.length || 0, inviteCount: row.referral?.invitedUsers?.length || 0 })), total, page, pageSize);
};

exports.listBookingsInternal = async ({ q, page, pageSize, status, paymentStatus, sortBy = "createdAt", sortDir = "desc" }) => {
  if (isSupabaseStore()) {
    let rows = await supabaseBookings.listAllBookings();
    const regex = buildSearchRegex(q);
    if (regex) {
      rows = rows.filter((item) =>
        [item.customerName, item.phoneNumber, item.status, item.paymentStatus, item.listingLabel]
          .some((value) => regex.test(String(value || "")))
      );
    }
    if (paymentStatus) rows = rows.filter((item) => item.paymentStatus === paymentStatus);
    if (status) rows = rows.filter((item) => item.status === status);
    const direction = sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      const av = a[sortBy] ?? "";
      const bv = b[sortBy] ?? "";
      return av > bv ? direction : av < bv ? -direction : 0;
    });
    const start = (page - 1) * pageSize;
    return paginateRows(rows.slice(start, start + pageSize), rows.length, page, pageSize);
  }
  if (!isMongoReady()) return paginateRows([], 0, page, pageSize);
  const regex = buildSearchRegex(q);
  const query = regex ? { $or: [{ customerName: regex }, { phoneNumber: regex }, { status: regex }, { paymentStatus: regex }] } : {};
  if (status) query.status = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;
  const direction = sortDir === "asc" ? 1 : -1;
  const [rows, total] = await Promise.all([
    Booking.find(query).sort({ [sortBy]: direction, createdAt: -1 }).populate("listingId").skip((page - 1) * pageSize).limit(pageSize).lean(),
    Booking.countDocuments(query),
  ]);
  return paginateRows(rows.map((item) => ({ ...item, listingLabel: item.listingId?.hotelName || item.listingId?.vehicleType || "Listing" })), total, page, pageSize);
};

function extractManualPayment(booking) {
  return booking?.manualPayment || booking?.liveTracking?.manualPayment || null;
}

function mapPaymentReviewRow(booking) {
  const manualPayment = extractManualPayment(booking);
  return {
    ...booking,
    paymentMethod: manualPayment?.method || "upi_qr",
    transactionId: manualPayment?.transactionId || booking?.paymentId || "",
    screenshotUrl: manualPayment?.screenshotUrl || "",
    paymentNote: manualPayment?.note || "",
    submittedAt: manualPayment?.submittedAt || booking?.updatedAt || booking?.createdAt || null,
    reviewedAt: manualPayment?.reviewedAt || null,
    reviewedBy: manualPayment?.reviewedBy || "",
    reviewStatus: manualPayment?.reviewStatus || (booking?.paymentStatus === "paid" ? "approved" : booking?.paymentStatus === "failed" ? "declined" : "pending"),
    reviewReason: manualPayment?.reviewReason || "",
  };
}

exports.listPaymentsInternal = async ({ q, page, pageSize, paymentStatus, sortBy = "submittedAt", sortDir = "desc" }) => {
  const data = await exports.listBookingsInternal({
    q,
    page: 1,
    pageSize: 5000,
    sortBy: "updatedAt",
    sortDir: "desc",
  });

  const regex = buildSearchRegex(q);
  let rows = (data.rows || [])
    .filter((item) => {
      const manualPayment = extractManualPayment(item);
      if (manualPayment?.method === "upi_qr") return true;
      return PAYMENT_REVIEW_STATUSES.includes(String(item.paymentStatus || "").toLowerCase());
    })
    .map(mapPaymentReviewRow);

  if (regex) {
    rows = rows.filter((item) =>
      [
        item.customerName,
        item.listingLabel,
        item.paymentStatus,
        item.transactionId,
        item.paymentMethod,
        item.phoneNumber,
      ].some((value) => regex.test(String(value || "")))
    );
  }

  if (paymentStatus) {
    rows = rows.filter((item) => item.paymentStatus === paymentStatus);
  }

  const direction = sortDir === "asc" ? 1 : -1;
  rows.sort((a, b) => {
    const av = a[sortBy] ?? "";
    const bv = b[sortBy] ?? "";
    return av > bv ? direction : av < bv ? -direction : 0;
  });

  const start = (page - 1) * pageSize;
  return paginateRows(rows.slice(start, start + pageSize), rows.length, page, pageSize);
};

exports.listReviewsInternal = async ({ q, page, pageSize, sortBy = "createdAt", sortDir = "desc" }) => {
  if (!isMongoReady()) return paginateRows([], 0, page, pageSize);
  const regex = buildSearchRegex(q);
  const query = regex ? { $or: [{ customerName: regex }, { comment: regex }] } : {};
  const direction = sortDir === "asc" ? 1 : -1;
  const [rows, total] = await Promise.all([
    Review.find(query).sort({ [sortBy]: direction, createdAt: -1 }).populate("hotelId").skip((page - 1) * pageSize).limit(pageSize).lean(),
    Review.countDocuments(query),
  ]);
  return paginateRows(rows.map((item) => ({ ...item, hotelName: item.hotelId?.hotelName || "Hotel" })), total, page, pageSize);
};

exports.listAuditLogsInternal = async ({ q, page, pageSize, action, targetType, sortBy = "createdAt", sortDir = "desc" }) => {
  if (!isMongoReady()) return paginateRows([], 0, page, pageSize);
  const regex = buildSearchRegex(q);
  const query = regex ? { $or: [{ adminEmail: regex }, { action: regex }, { targetType: regex }, { summary: regex }, { targetId: regex }] } : {};
  if (action) query.action = action;
  if (targetType) query.targetType = targetType;
  const direction = sortDir === "asc" ? 1 : -1;
  const [rows, total] = await Promise.all([
    AdminAuditLog.find(query).sort({ [sortBy]: direction, createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    AdminAuditLog.countDocuments(query),
  ]);
  return paginateRows(rows, total, page, pageSize);
};

exports.getOverview = async (_req, res, next) => {
  try {
    const [users, userMetaCount, hotels, pendingHotels, rides, pendingRides, trips, reviews, audits, allSupabaseBookings] = await Promise.all([
      loadSupabaseUsers(),
      safeCount(UserMeta),
      safeCount(Hotel),
      safeCount(Hotel, { status: { $ne: "approved" } }),
      safeCount(Transport),
      safeCount(Transport, { status: { $ne: "approved" } }),
      safeCount(Trip),
      safeCount(Review),
      safeCount(AdminAuditLog),
      isSupabaseStore() ? supabaseBookings.listAllBookings() : Promise.resolve([]),
    ]);
    const bookings = isSupabaseStore() ? allSupabaseBookings.length : await safeCount(Booking);
    const pendingBookings = isSupabaseStore()
      ? allSupabaseBookings.filter((item) => item.status === "pending").length
      : await safeCount(Booking, { status: "pending" });
    const pendingPayments = isSupabaseStore()
      ? allSupabaseBookings.filter((item) => item.paymentStatus === "under_review").length
      : await safeCount(Booking, { paymentStatus: "under_review" });
    const recentBookings = isSupabaseStore()
      ? allSupabaseBookings.slice(0, 6).map((item) => ({
          _id: item._id,
          customerName: item.customerName,
          bookingType: item.bookingType,
          status: item.status,
          paymentStatus: item.paymentStatus,
          amount: item.amount,
          createdAt: item.createdAt,
          listingLabel: item.listingLabel || "Listing",
        }))
      : isMongoReady()
        ? await Booking.find().sort({ createdAt: -1 }).limit(6).populate("listingId").lean()
        : [];
    return res.json({
      success: true,
      data: {
        totals: { users: users.length, userMeta: userMetaCount, hotels, pendingHotels, rides, pendingRides, bookings, pendingBookings, pendingPayments, trips, reviews, audits },
        recentBookings: isSupabaseStore() ? recentBookings : recentBookings.map((item) => ({
          _id: item._id,
          customerName: item.customerName,
          bookingType: item.bookingType,
          status: item.status,
          paymentStatus: item.paymentStatus,
          amount: item.amount,
          createdAt: item.createdAt,
          listingLabel: item.listingId?.hotelName || item.listingId?.vehicleType || item.listingId?.title || "Listing",
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.listUsers = async (req, res, next) => { try { const { page, pageSize } = getPaging(req); const sort = getSort(req, { sortBy: "createdAt", sortDir: "desc" }); const data = await exports.listUsersInternal({ q: req.query.q, role: req.query.role, page, pageSize, ...sort }); return res.json({ success: true, data: data.rows, pagination: data.pagination }); } catch (err) { next(err); } };
exports.listUserMeta = async (req, res, next) => { try { const { page, pageSize } = getPaging(req); const sort = getSort(req); const data = await exports.listUserMetaInternal({ q: req.query.q, page, pageSize, ...sort }); return res.json({ success: true, data: data.rows, pagination: data.pagination }); } catch (err) { next(err); } };
exports.listHotels = async (req, res, next) => {
  try {
    const { page, pageSize } = getPaging(req);
    const sort = getSort(req);
    if (isSupabaseStore()) {
      let rows = await supabaseHotels.listAllHotels();
      const regex = buildSearchRegex(req.query.q);
      if (regex) {
        rows = rows.filter((row) =>
          [row.hotelName, row.location, row.contactNumber, row.description]
            .some((value) => regex.test(String(value || "")))
        );
      }
      if (req.query.status) {
        rows = rows.filter((row) => row.status === req.query.status);
      }
      const direction = sort.sortDir === "asc" ? 1 : -1;
      rows.sort((a, b) => {
        const av = a[sort.sortBy] ?? "";
        const bv = b[sort.sortBy] ?? "";
        return av > bv ? direction : av < bv ? -direction : 0;
      });
      const start = (page - 1) * pageSize;
      const paged = rows.slice(start, start + pageSize);
      return res.json({ success: true, data: paged, pagination: paginateRows([], rows.length, page, pageSize).pagination });
    }
    const data = await exports.listModelInternal(Hotel, { q: req.query.q, status: req.query.status, page, pageSize, ...sort }, ["hotelName", "location", "contactNumber", "description"]);
    return res.json({ success: true, data: data.rows, pagination: data.pagination });
  } catch (err) { next(err); }
};
exports.listRides = async (req, res, next) => {
  try {
    const { page, pageSize } = getPaging(req);
    const sort = getSort(req);
    if (isSupabaseStore()) {
      let rows = await supabaseTransports.listAllRides();
      const regex = buildSearchRegex(req.query.q);
      if (regex) {
        rows = rows.filter((row) =>
          [row.vehicleModel, row.vehicleType, row.routeFrom, row.routeTo, row.plateNumber, row.driverName]
            .some((value) => regex.test(String(value || "")))
        );
      }
      if (req.query.status) {
        rows = rows.filter((row) => row.status === req.query.status);
      }
      const direction = sort.sortDir === "asc" ? 1 : -1;
      rows.sort((a, b) => {
        const av = a[sort.sortBy] ?? "";
        const bv = b[sort.sortBy] ?? "";
        return av > bv ? direction : av < bv ? -direction : 0;
      });
      const start = (page - 1) * pageSize;
      const paged = rows.slice(start, start + pageSize);
      return res.json({ success: true, data: paged, pagination: paginateRows([], rows.length, page, pageSize).pagination });
    }
    const data = await exports.listModelInternal(Transport, { q: req.query.q, status: req.query.status, page, pageSize, ...sort }, ["vehicleModel", "vehicleType", "routeFrom", "routeTo", "plateNumber", "driverName"]);
    return res.json({ success: true, data: data.rows, pagination: data.pagination });
  } catch (err) { next(err); }
};
exports.listBookings = async (req, res, next) => { try { const { page, pageSize } = getPaging(req); const sort = getSort(req, { sortBy: "createdAt", sortDir: "desc" }); const data = await exports.listBookingsInternal({ q: req.query.q, status: req.query.status, paymentStatus: req.query.paymentStatus, page, pageSize, ...sort }); return res.json({ success: true, data: data.rows, pagination: data.pagination }); } catch (err) { next(err); } };
exports.listPayments = async (req, res, next) => { try { const { page, pageSize } = getPaging(req); const sort = getSort(req, { sortBy: "submittedAt", sortDir: "desc" }); const data = await exports.listPaymentsInternal({ q: req.query.q, paymentStatus: req.query.paymentStatus, page, pageSize, ...sort }); return res.json({ success: true, data: data.rows, pagination: data.pagination }); } catch (err) { next(err); } };
exports.listTrips = async (req, res, next) => { try { const { page, pageSize } = getPaging(req); const sort = getSort(req); const data = await exports.listModelInternal(Trip, { q: req.query.q, status: req.query.status, page, pageSize, ...sort }, ["title", "status", "userId"]); return res.json({ success: true, data: data.rows, pagination: data.pagination }); } catch (err) { next(err); } };
exports.listReviews = async (req, res, next) => { try { const { page, pageSize } = getPaging(req); const sort = getSort(req, { sortBy: "createdAt", sortDir: "desc" }); const data = await exports.listReviewsInternal({ q: req.query.q, page, pageSize, ...sort }); return res.json({ success: true, data: data.rows, pagination: data.pagination }); } catch (err) { next(err); } };
exports.listAuditLogs = async (req, res, next) => { try { const { page, pageSize } = getPaging(req); const sort = getSort(req, { sortBy: "createdAt", sortDir: "desc" }); const data = await exports.listAuditLogsInternal({ q: req.query.q, action: req.query.action, targetType: req.query.targetType, page, pageSize, ...sort }); return res.json({ success: true, data: data.rows, pagination: data.pagination }); } catch (err) { next(err); } };

exports.updateUser = async (req, res, next) => {
  try {
    const supabase = getSupabaseClient();
    const { role, displayName, bannedUntil } = req.body || {};
    const current = await supabase.auth.admin.getUserById(req.params.id);
    if (current.error || !current.data?.user) return res.status(404).json({ success: false, message: "User not found" });
    const user = current.data.user;
    const nextAppMetadata = { ...(user.app_metadata || {}) };
    const nextUserMetadata = { ...(user.user_metadata || {}) };
    if (typeof role === "string" && normalizeRole(role)) nextAppMetadata.role = normalizeRole(role);
    if (typeof displayName === "string") { nextUserMetadata.full_name = displayName; nextUserMetadata.display_name = displayName; }
    const payload = { app_metadata: nextAppMetadata, user_metadata: nextUserMetadata };
    if (bannedUntil !== undefined) payload.banned_until = bannedUntil || null;
    const { data, error } = await supabase.auth.admin.updateUserById(req.params.id, payload);
    if (error) return res.status(400).json({ success: false, message: error.message });
    if (isMongoReady() && (typeof displayName === "string" || data.user?.email)) {
      await UserMeta.findOneAndUpdate(
        { userId: req.params.id },
        { $set: { email: data.user?.email || "", displayName: displayName ?? "" } },
        { upsert: true, new: true }
      );
    }
    await logAdminAction(req, "update", "user", req.params.id, "Updated user role/profile", { role: nextAppMetadata.role, displayName });
    return res.json({ success: true, data: { id: data.user.id, email: data.user.email, role: data.user.app_metadata?.role || "user", displayName: data.user.user_metadata?.full_name || "", bannedUntil: data.user.banned_until || null } });
  } catch (err) { next(err); }
};

exports.terminateUser = async (req, res, next) => {
  try {
    const supabase = getSupabaseClient();
    const current = await supabase.auth.admin.getUserById(req.params.id);
    if (current.error || !current.data?.user) return res.status(404).json({ success: false, message: "User not found" });
    const email = current.data.user.email || "";
    if (isMongoReady()) {
      await Promise.all([
        UserMeta.deleteOne({ userId: req.params.id }),
        Trip.deleteMany({ userId: req.params.id }),
        Booking.deleteMany({ userId: req.params.id }),
        Hotel.deleteMany({ owner: req.params.id }),
        Transport.deleteMany({ owner: req.params.id }),
        User.deleteMany({ email }),
      ]);
    }
    const { error } = await supabase.auth.admin.deleteUser(req.params.id);
    if (error) return res.status(400).json({ success: false, message: error.message });
    await logAdminAction(req, "terminate", "user", req.params.id, "Terminated user", { email });
    return res.json({ success: true, message: "User terminated" });
  } catch (err) { next(err); }
};

async function updateAndLog(req, Model, id, allowed, targetType, summary) {
  const update = pickAllowed(req.body || {}, allowed);
  const data = await Model.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
  if (!data) return null;
  await logAdminAction(req, "update", targetType, id, summary, update);
  return data;
}

function buildHotelSupabasePatch(body = {}) {
  const update = pickAllowed(body, HOTEL_FIELDS);
  const patch = {};
  if (update.hotelName !== undefined) patch.hotel_name = update.hotelName;
  if (update.propertyType !== undefined) patch.property_type = update.propertyType;
  if (update.location !== undefined) patch.location = update.location;
  if (update.landmark !== undefined) patch.landmark = update.landmark;
  if (update.ownerName !== undefined) patch.owner_name = update.ownerName;
  if (update.pricePerNight !== undefined) patch.price_per_night = Number(update.pricePerNight);
  if (update.roomsAvailable !== undefined) patch.rooms_available = Number(update.roomsAvailable);
  if (update.guestsPerRoom !== undefined) patch.guests_per_room = Number(update.guestsPerRoom);
  if (update.availabilityStatus !== undefined) patch.availability_status = update.availabilityStatus;
  if (update.contactNumber !== undefined) patch.contact_number = update.contactNumber;
  if (update.description !== undefined) patch.description = update.description;
  if (update.images !== undefined) patch.images = update.images;
  if (update.amenities !== undefined) patch.amenities = update.amenities;
  if (update.complianceDetails !== undefined) patch.compliance_details = update.complianceDetails;
  if (update.verificationDocuments !== undefined) patch.verification_documents = update.verificationDocuments;
  if (update.owner !== undefined) patch.owner_id = update.owner;
  if (update.status !== undefined) patch.status = update.status;
  if (update.isVerified !== undefined) patch.is_verified = Boolean(update.isVerified);
  return patch;
}

function buildRideSupabasePatch(body = {}) {
  const update = pickAllowed(body, RIDE_FIELDS);
  const patch = {};
  if (update.vehicleModel !== undefined) patch.vehicle_model = update.vehicleModel;
  if (update.vehicleType !== undefined) patch.vehicle_type = update.vehicleType;
  if (update.plateNumber !== undefined) patch.plate_number = update.plateNumber;
  if (update.routeFrom !== undefined) patch.route_from = update.routeFrom;
  if (update.routeTo !== undefined) patch.route_to = update.routeTo;
  if (update.fromCoords !== undefined) patch.from_coords = update.fromCoords;
  if (update.toCoords !== undefined) patch.to_coords = update.toCoords;
  if (update.pricePerSeat !== undefined) patch.price_per_seat = Number(update.pricePerSeat);
  if (update.seatsAvailable !== undefined) patch.seats_available = Number(update.seatsAvailable);
  if (update.driverName !== undefined) patch.driver_name = update.driverName;
  if (update.contactNumber !== undefined) patch.contact_number = update.contactNumber;
  if (update.images !== undefined) patch.images = update.images;
  if (update.complianceDetails !== undefined) patch.compliance_details = update.complianceDetails;
  if (update.verificationDocuments !== undefined) patch.verification_documents = update.verificationDocuments;
  if (update.owner !== undefined) patch.owner_id = update.owner;
  if (update.status !== undefined) patch.status = update.status;
  if (update.isVerified !== undefined) patch.is_verified = Boolean(update.isVerified);
  return patch;
}

function extractMissingColumn(errorMessage = "") {
  const match = String(errorMessage).match(/Could not find the '([^']+)' column/i);
  return match ? match[1] : "";
}

async function supabaseUpdateWithSchemaFallback(table, id, patch = {}) {
  const supabase = getSupabaseClient();
  let current = { ...patch };

  for (let i = 0; i < 8; i += 1) {
    const { data, error } = await supabase
      .from(table)
      .update(current)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (!error) return { data, error: null, appliedPatch: current };

    const missing = extractMissingColumn(error.message);
    if (!missing || !(missing in current)) {
      return { data: null, error, appliedPatch: current };
    }

    delete current[missing];
  }

  return { data: null, error: { message: "Update failed due to schema mismatch." }, appliedPatch: current };
}

exports.updateUserMeta = async (req, res, next) => { try { const data = await updateAndLog(req, UserMeta, req.params.id, USER_META_FIELDS, "userMeta", "Updated user meta"); if (!data) return res.status(404).json({ success: false, message: "User meta not found" }); return res.json({ success: true, data }); } catch (err) { next(err); } };
exports.updateHotel = async (req, res, next) => {
  try {
    if (isSupabaseStore()) {
      const patch = buildHotelSupabasePatch(req.body || {});
      const { data, error, appliedPatch } = await supabaseUpdateWithSchemaFallback("hotels", req.params.id, patch);

      if (error) return res.status(400).json({ success: false, message: error.message });
      if (!data) return res.status(404).json({ success: false, message: "Hotel not found" });

      await logAdminAction(req, "update", "hotel", req.params.id, "Updated hotel", appliedPatch);
      return res.json({ success: true, data: supabaseHotels.mapHotelRow(data) });
    }

    const data = await updateAndLog(req, Hotel, req.params.id, HOTEL_FIELDS, "hotel", "Updated hotel");
    if (!data) return res.status(404).json({ success: false, message: "Hotel not found" });
    return res.json({ success: true, data });
  } catch (err) { next(err); }
};
exports.updateRide = async (req, res, next) => {
  try {
    if (isSupabaseStore()) {
      const patch = buildRideSupabasePatch(req.body || {});
      const { data, error, appliedPatch } = await supabaseUpdateWithSchemaFallback("transports", req.params.id, patch);

      if (error) return res.status(400).json({ success: false, message: error.message });
      if (!data) return res.status(404).json({ success: false, message: "Ride not found" });

      await logAdminAction(req, "update", "ride", req.params.id, "Updated ride", appliedPatch);
      return res.json({ success: true, data: supabaseTransports.mapTransportRow(data) });
    }

    const data = await updateAndLog(req, Transport, req.params.id, RIDE_FIELDS, "ride", "Updated ride");
    if (!data) return res.status(404).json({ success: false, message: "Ride not found" });
    return res.json({ success: true, data });
  } catch (err) { next(err); }
};
exports.updateTrip = async (req, res, next) => { try { const data = await updateAndLog(req, Trip, req.params.id, TRIP_FIELDS, "trip", "Updated trip"); if (!data) return res.status(404).json({ success: false, message: "Trip not found" }); return res.json({ success: true, data }); } catch (err) { next(err); } };

async function applyBookingInventoryApproval(booking) {
  if (!booking || booking.paymentStatus === "paid") return;

  if (booking.bookingType === "Transport") {
    const seatsRequested = Math.max(1, Number(booking.guests || 1));

    if (isSupabaseStore()) {
      const ride = await supabaseTransports.getRideById(String(booking.listingId));
      if (!ride || Number(ride.seatsAvailable || 0) < seatsRequested) {
        throw new Error("Selected ride is no longer available.");
      }
      await supabaseTransports.updateTransport({
        ownerId: String(ride.owner || ""),
        id: String(booking.listingId),
        updateFields: { seatsAvailable: Number(ride.seatsAvailable) - seatsRequested },
      });
      return;
    }

    const ride = await Transport.findById(booking.listingId);
    if (!ride || Number(ride.seatsAvailable || 0) < seatsRequested) {
      throw new Error("Selected ride is no longer available.");
    }
    ride.seatsAvailable -= seatsRequested;
    await ride.save();
    return;
  }

  if (booking.bookingType === "Hotel") {
    const roomsRequested = Math.max(1, Number(booking.rooms || 1));

    if (isSupabaseStore()) {
      const hotel = await supabaseHotels.getHotelById(String(booking.listingId));
      if (!hotel || Number(hotel.roomsAvailable || 0) < roomsRequested) {
        throw new Error("Selected stay is no longer available.");
      }
      await supabaseHotels.updateHotel({
        ownerId: String(hotel.owner || ""),
        id: String(booking.listingId),
        updateData: { roomsAvailable: Number(hotel.roomsAvailable) - roomsRequested },
      });
      return;
    }

    const hotel = await Hotel.findById(booking.listingId);
    if (!hotel || Number(hotel.roomsAvailable || 0) < roomsRequested) {
      throw new Error("Selected stay is no longer available.");
    }
    hotel.roomsAvailable -= roomsRequested;
    await hotel.save();
  }
}

async function emitPaymentQueueUpdate(io, type, booking) {
  if (!io) return;
  const queue = await exports.listPaymentsInternal({ q: "", page: 1, pageSize: 5000, sortBy: "submittedAt", sortDir: "desc" });
  io.to("admin-payments").emit("payment:queue-updated", {
    type,
    payment: booking ? mapPaymentReviewRow(booking) : null,
    pendingCount: (queue.rows || []).filter((item) => item.paymentStatus === "under_review").length,
  });
}

function buildReviewedManualPayment(currentManualPayment, reviewerId, status, reason = "") {
  return {
    ...(currentManualPayment || {}),
    reviewStatus: status,
    reviewReason: String(reason || "").trim(),
    reviewedAt: new Date(),
    reviewedBy: String(reviewerId || ""),
  };
}

async function notifyPaymentApproval(io, booking) {
  await createNotification(
    {
      userId: booking.userId,
      title: "Payment approved",
      message: `Your payment for ${booking.listingLabel || "the selected booking"} has been approved.`,
      type: "booking_paid",
      data: { bookingId: String(booking._id), bookingType: booking.bookingType, stage: "payment_approved" },
    },
    io
  );

  await createNotification(
    {
      userId: booking.ownerId,
      title: "Paid booking ready",
      message: `${booking.customerName} has completed payment for ${booking.listingLabel || "your listing"}. Review the booking and continue fulfillment.`,
      type: "booking_request",
      data: { bookingId: String(booking._id), bookingType: booking.bookingType, stage: "payment_approved" },
    },
    io
  );
}

async function notifyPaymentDecline(io, booking, reason = "") {
  await createNotification(
    {
      userId: booking.userId,
      title: "Payment proof declined",
      message: reason
        ? `Your payment proof for ${booking.listingLabel || "the selected booking"} was declined: ${reason}`
        : `Your payment proof for ${booking.listingLabel || "the selected booking"} was declined. Please submit a new payment proof.`,
      type: "booking_declined",
      data: { bookingId: String(booking._id), bookingType: booking.bookingType, stage: "payment_declined" },
    },
    io
  );
}

exports.updateBooking = async (req, res, next) => {
  try {
    const update = pickAllowed(req.body || {}, BOOKING_FIELDS);

    if (isSupabaseStore()) {
      const current = await supabaseBookings.getBookingById(req.params.id);
      if (!current) return res.status(404).json({ success: false, message: "Booking not found" });

      if (update.paymentStatus === "paid" && current.paymentStatus !== "paid") {
        await applyBookingInventoryApproval(current);
      }

      const mergedManualPayment = current.manualPayment || current.liveTracking?.manualPayment || null;
      const data = await supabaseBookings.updateBookingById(req.params.id, {
        ...update,
        liveTracking: {
          ...(current.liveTracking || {}),
          ...(mergedManualPayment ? { manualPayment: mergedManualPayment } : {}),
        },
      });

      if (update.paymentStatus === "paid" && current.paymentStatus !== "paid") {
        await notifyPaymentApproval(req.app.get("io"), data);
      }

      await logAdminAction(req, "update", "booking", req.params.id, "Updated booking", update);
      return res.json({ success: true, data });
    }

    const current = await Booking.findById(req.params.id);
    if (!current) return res.status(404).json({ success: false, message: "Booking not found" });
    const previousPaymentStatus = current.paymentStatus;

    if (update.paymentStatus === "paid" && previousPaymentStatus !== "paid") {
      await applyBookingInventoryApproval(current);
    }

    Object.assign(current, update);
    if (update.paymentStatus === "paid") {
      current.manualPayment = {
        ...(current.manualPayment?.toObject?.() || current.manualPayment || {}),
        reviewedAt: new Date(),
        reviewedBy: String(req.user?.id || ""),
      };
    }

    await current.save();
    const data = await Booking.findById(req.params.id).populate("listingId").lean();

    if (update.paymentStatus === "paid" && previousPaymentStatus !== "paid") {
      await notifyPaymentApproval(req.app.get("io"), { ...data, listingLabel: data.listingId?.hotelName || data.listingId?.vehicleType || current.listingLabel || "Listing" });
    }

    await logAdminAction(req, "update", "booking", req.params.id, "Updated booking", update);
    return res.json({ success: true, data: { ...data, listingLabel: data.listingId?.hotelName || data.listingId?.vehicleType || "Listing" } });
  } catch (err) { next(err); }
};

exports.approvePayment = async (req, res, next) => {
  try {
    const io = req.app.get("io");
    const reviewerId = String(req.user?.id || "");

    if (isSupabaseStore()) {
      const current = await supabaseBookings.getBookingById(req.params.id);
      if (!current) return res.status(404).json({ success: false, message: "Payment record not found" });
      const currentManualPayment = extractManualPayment(current);
      if (!currentManualPayment) return res.status(400).json({ success: false, message: "This booking does not have a manual payment proof." });

      if (current.paymentStatus !== "paid") {
        await applyBookingInventoryApproval(current);
      }

      const reviewedManualPayment = buildReviewedManualPayment(currentManualPayment, reviewerId, "approved", req.body?.reason);
      const updated = await supabaseBookings.updateBookingById(req.params.id, {
        paymentStatus: "paid",
        paymentId: currentManualPayment.transactionId || current.paymentId || "",
        liveTracking: {
          ...(current.liveTracking || {}),
          manualPayment: reviewedManualPayment,
        },
      });

      await notifyPaymentApproval(io, updated);
      await emitPaymentQueueUpdate(io, "approved", updated);
      await logAdminAction(req, "approve_payment", "payment", req.params.id, "Approved manual payment", { reason: req.body?.reason || "" });
      return res.json({ success: true, data: mapPaymentReviewRow(updated) });
    }

    const current = await Booking.findById(req.params.id);
    if (!current) return res.status(404).json({ success: false, message: "Payment record not found" });
    if (!current.manualPayment?.method) return res.status(400).json({ success: false, message: "This booking does not have a manual payment proof." });

    if (current.paymentStatus !== "paid") {
      await applyBookingInventoryApproval(current);
    }

    current.paymentStatus = "paid";
    current.paymentId = current.manualPayment.transactionId || current.paymentId || "";
    current.manualPayment = buildReviewedManualPayment(current.manualPayment, reviewerId, "approved", req.body?.reason);
    await current.save();

    const updated = await Booking.findById(req.params.id).lean();
    const normalized = { ...updated, listingLabel: updated.listingLabel || "Booking", manualPayment: updated.manualPayment };
    await notifyPaymentApproval(io, normalized);
    await emitPaymentQueueUpdate(io, "approved", normalized);
    await logAdminAction(req, "approve_payment", "payment", req.params.id, "Approved manual payment", { reason: req.body?.reason || "" });
    return res.json({ success: true, data: mapPaymentReviewRow(normalized) });
  } catch (err) {
    next(err);
  }
};

exports.declinePayment = async (req, res, next) => {
  try {
    const io = req.app.get("io");
    const reviewerId = String(req.user?.id || "");
    const reviewReason = String(req.body?.reason || "").trim();

    if (isSupabaseStore()) {
      const current = await supabaseBookings.getBookingById(req.params.id);
      if (!current) return res.status(404).json({ success: false, message: "Payment record not found" });
      const currentManualPayment = extractManualPayment(current);
      if (!currentManualPayment) return res.status(400).json({ success: false, message: "This booking does not have a manual payment proof." });

      const reviewedManualPayment = buildReviewedManualPayment(currentManualPayment, reviewerId, "declined", reviewReason);
      const updated = await supabaseBookings.updateBookingById(req.params.id, {
        paymentStatus: "failed",
        liveTracking: {
          ...(current.liveTracking || {}),
          manualPayment: reviewedManualPayment,
        },
      });

      await notifyPaymentDecline(io, updated, reviewReason);
      await emitPaymentQueueUpdate(io, "declined", updated);
      await logAdminAction(req, "decline_payment", "payment", req.params.id, "Declined manual payment", { reason: reviewReason });
      return res.json({ success: true, data: mapPaymentReviewRow(updated) });
    }

    const current = await Booking.findById(req.params.id);
    if (!current) return res.status(404).json({ success: false, message: "Payment record not found" });
    if (!current.manualPayment?.method) return res.status(400).json({ success: false, message: "This booking does not have a manual payment proof." });

    current.paymentStatus = "failed";
    current.manualPayment = buildReviewedManualPayment(current.manualPayment, reviewerId, "declined", reviewReason);
    await current.save();

    const updated = await Booking.findById(req.params.id).lean();
    const normalized = { ...updated, listingLabel: updated.listingLabel || "Booking", manualPayment: updated.manualPayment };
    await notifyPaymentDecline(io, normalized, reviewReason);
    await emitPaymentQueueUpdate(io, "declined", normalized);
    await logAdminAction(req, "decline_payment", "payment", req.params.id, "Declined manual payment", { reason: reviewReason });
    return res.json({ success: true, data: mapPaymentReviewRow(normalized) });
  } catch (err) {
    next(err);
  }
};

async function deleteAndLog(req, Model, id, targetType, summary, extraWork) {
  const data = await Model.findByIdAndDelete(id).lean();
  if (!data) return null;
  if (extraWork) await extraWork();
  await logAdminAction(req, "delete", targetType, id, summary, { deleted: true });
  return data;
}

exports.deleteUserMeta = async (req, res, next) => { try { const data = await deleteAndLog(req, UserMeta, req.params.id, "userMeta", "Deleted user meta"); if (!data) return res.status(404).json({ success: false, message: "User meta not found" }); return res.json({ success: true, message: "User meta deleted" }); } catch (err) { next(err); } };
exports.deleteHotel = async (req, res, next) => { try { const data = await deleteAndLog(req, Hotel, req.params.id, "hotel", "Deleted hotel", async () => { await Booking.deleteMany({ listingId: req.params.id, bookingType: "Hotel" }); await Review.deleteMany({ hotelId: req.params.id }); }); if (!data) return res.status(404).json({ success: false, message: "Hotel not found" }); return res.json({ success: true, message: "Hotel deleted" }); } catch (err) { next(err); } };
exports.deleteRide = async (req, res, next) => { try { const data = await deleteAndLog(req, Transport, req.params.id, "ride", "Deleted ride", async () => { await Booking.deleteMany({ listingId: req.params.id, bookingType: "Transport" }); }); if (!data) return res.status(404).json({ success: false, message: "Ride not found" }); return res.json({ success: true, message: "Ride deleted" }); } catch (err) { next(err); } };
exports.deleteBooking = async (req, res, next) => { try { const data = await deleteAndLog(req, Booking, req.params.id, "booking", "Deleted booking"); if (!data) return res.status(404).json({ success: false, message: "Booking not found" }); return res.json({ success: true, message: "Booking deleted" }); } catch (err) { next(err); } };
exports.deleteTrip = async (req, res, next) => { try { const data = await deleteAndLog(req, Trip, req.params.id, "trip", "Deleted trip"); if (!data) return res.status(404).json({ success: false, message: "Trip not found" }); return res.json({ success: true, message: "Trip deleted" }); } catch (err) { next(err); } };
exports.deleteReview = async (req, res, next) => { try { const data = await deleteAndLog(req, Review, req.params.id, "review", "Deleted review"); if (!data) return res.status(404).json({ success: false, message: "Review not found" }); return res.json({ success: true, message: "Review deleted" }); } catch (err) { next(err); } };

exports.getRawCollection = async (req, res, next) => {
  try {
    if (!isMongoReady()) {
      const { page, pageSize } = getPaging(req);
      return res.json({ success: true, data: [], pagination: paginateRows([], 0, page, pageSize).pagination });
    }
    const model = getRawModel(req.params.collection);
    const { page, pageSize } = getPaging(req);
    const regex = buildSearchRegex(req.query.q);
    const query = regex ? { $or: Object.keys(model.schema.paths).filter((key) => !["_id", "__v"].includes(key)).slice(0, 8).map((key) => ({ [key]: regex })) } : {};
    const [rows, total] = await Promise.all([
      model.find(query).sort({ updatedAt: -1, createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
      model.countDocuments(query),
    ]);
    return res.json({ success: true, data: rows, pagination: paginateRows([], total, page, pageSize).pagination });
  } catch (err) { next(err); }
};

exports.updateRawRecord = async (req, res, next) => {
  try {
    if (!isMongoReady()) return res.status(400).json({ success: false, message: "Raw ops require Mongo-backed collections." });
    const model = getRawModel(req.params.collection);
    const payload = { ...(req.body || {}) };
    delete payload._id;
    delete payload.__v;
    const data = await model.findByIdAndUpdate(req.params.id, { $set: payload }, { new: true }).lean();
    if (!data) return res.status(404).json({ success: false, message: "Record not found" });
    await logAdminAction(req, "update", `raw:${req.params.collection}`, req.params.id, "Updated raw record", { keys: Object.keys(payload) });
    return res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.deleteRawRecord = async (req, res, next) => {
  try {
    if (!isMongoReady()) return res.status(400).json({ success: false, message: "Raw ops require Mongo-backed collections." });
    const model = getRawModel(req.params.collection);
    const data = await model.findByIdAndDelete(req.params.id).lean();
    if (!data) return res.status(404).json({ success: false, message: "Record not found" });
    await logAdminAction(req, "delete", `raw:${req.params.collection}`, req.params.id, "Deleted raw record");
    return res.json({ success: true, message: "Record deleted" });
  } catch (err) { next(err); }
};

exports.bulkAction = async (req, res, next) => {
  try {
    if (!isMongoReady()) return res.status(400).json({ success: false, message: "Bulk actions are unavailable without Mongo-backed collections." });
    const { section, ids = [], action, payload = {} } = req.body || {};
    if (!section || !action || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, message: "section, action, and ids are required" });
    let result;
    if (section === "hotels") {
      if (action === "approve") result = await Hotel.updateMany({ _id: { $in: ids } }, { $set: { status: "approved", isVerified: true } });
      else if (action === "pending") result = await Hotel.updateMany({ _id: { $in: ids } }, { $set: { status: "pending", isVerified: false } });
      else if (action === "delete") result = await Hotel.deleteMany({ _id: { $in: ids } });
    }
    if (section === "rides") {
      if (action === "approve") result = await Transport.updateMany({ _id: { $in: ids } }, { $set: { status: "approved", isVerified: true } });
      else if (action === "pending") result = await Transport.updateMany({ _id: { $in: ids } }, { $set: { status: "pending", isVerified: false } });
      else if (action === "reject") result = await Transport.updateMany({ _id: { $in: ids } }, { $set: { status: "rejected", isVerified: false } });
      else if (action === "delete") result = await Transport.deleteMany({ _id: { $in: ids } });
    }
    if (section === "bookings") {
      if (action === "set-status") result = await Booking.updateMany({ _id: { $in: ids } }, { $set: { status: payload.status || "pending" } });
      else if (action === "set-payment") result = await Booking.updateMany({ _id: { $in: ids } }, { $set: { paymentStatus: payload.paymentStatus || "pending" } });
      else if (action === "delete") result = await Booking.deleteMany({ _id: { $in: ids } });
    }
    if (section === "trips") {
      if (action === "set-status") result = await Trip.updateMany({ _id: { $in: ids } }, { $set: { status: payload.status || "draft" } });
      else if (action === "delete") result = await Trip.deleteMany({ _id: { $in: ids } });
    }
    if (section === "reviews" && action === "delete") result = await Review.deleteMany({ _id: { $in: ids } });
    if (section === "userMeta" && action === "delete") result = await UserMeta.deleteMany({ _id: { $in: ids } });
    if (!result) return res.status(400).json({ success: false, message: "Unsupported bulk action" });
    const count = result.modifiedCount ?? result.deletedCount ?? 0;
    await logAdminAction(req, "bulk", section, ids.join(","), `Bulk ${action} on ${count} records`, { ids, payload });
    return res.json({ success: true, data: { section, action, count } });
  } catch (err) { next(err); }
};

exports.exportSection = async (req, res, next) => {
  try {
    const section = req.params.section;
    const format = String(req.query.format || "json").toLowerCase();
    const fetcher = EXPORT_FETCHERS[section];
    if (!fetcher) return res.status(400).json({ success: false, message: "Unsupported export section" });
    const rows = await fetcher();
    await logAdminAction(req, "export", section, "", `Exported ${section}`, { format, count: rows.length });
    const filename = `admin-${section}-${new Date().toISOString().slice(0, 10)}.${format === "csv" ? "csv" : "json"}`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      return res.send(toCsv(rows));
    }
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.send(JSON.stringify(rows, null, 2));
  } catch (err) { next(err); }
};
