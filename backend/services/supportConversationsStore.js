const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { getDataStore } = require("../utils/dataStore");
const { getSupabaseClient } = require("../utils/supabaseClient");

const TABLE = "support_conversations";
const FILE_DIR = path.resolve(__dirname, "..", "data");
const FILE_PATH = path.join(FILE_DIR, "support-conversations.json");

let cachedMode = null;

function ensureFileStore() {
  if (!fs.existsSync(FILE_DIR)) fs.mkdirSync(FILE_DIR, { recursive: true });
  if (!fs.existsSync(FILE_PATH)) fs.writeFileSync(FILE_PATH, "[]", "utf8");
}

function readFileRows() {
  ensureFileStore();
  try {
    const parsed = JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch (_err) {
    return [];
  }
}

function writeFileRows(rows) {
  ensureFileStore();
  fs.writeFileSync(FILE_PATH, JSON.stringify(rows, null, 2), "utf8");
}

function nowIso() {
  return new Date().toISOString();
}

function mapRowToConversation(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    userId: row.user_id || "",
    userEmail: row.user_email || "",
    guestLabel: row.guest_label || "Explorer",
    status: row.status || "queued",
    handoffReason: row.handoff_reason || "",
    lastUserMessage: row.last_user_message || "",
    lastAdminMessage: row.last_admin_message || "",
    messages: Array.isArray(row.messages) ? row.messages : [],
    createdAt: row.created_at || nowIso(),
    updatedAt: row.updated_at || nowIso(),
  };
}

function mapConversationToRow(conversation) {
  return {
    id: conversation.id,
    user_id: conversation.userId || "",
    user_email: conversation.userEmail || "",
    guest_label: conversation.guestLabel || "Explorer",
    status: conversation.status || "queued",
    handoff_reason: conversation.handoffReason || "",
    last_user_message: conversation.lastUserMessage || "",
    last_admin_message: conversation.lastAdminMessage || "",
    messages: Array.isArray(conversation.messages) ? conversation.messages : [],
    created_at: conversation.createdAt || nowIso(),
    updated_at: conversation.updatedAt || nowIso(),
  };
}

async function detectMode() {
  if (cachedMode) return cachedMode;

  if (getDataStore() !== "supabase") {
    cachedMode = "file";
    return cachedMode;
  }

  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from(TABLE).select("id").limit(1);
    if (!error) {
      cachedMode = "supabase";
      return cachedMode;
    }
    cachedMode = "file";
    return cachedMode;
  } catch (_err) {
    cachedMode = "file";
    return cachedMode;
  }
}

async function listConversations() {
  const mode = await detectMode();
  if (mode === "supabase") {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(mapRowToConversation);
  }

  return readFileRows()
    .map(mapRowToConversation)
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
}

async function getConversationById(id) {
  if (!id) return null;
  const mode = await detectMode();
  if (mode === "supabase") {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("id", String(id))
      .maybeSingle();
    if (error) throw new Error(error.message);
    return mapRowToConversation(data);
  }

  const rows = readFileRows();
  const row = rows.find((item) => String(item.id) === String(id));
  return mapRowToConversation(row);
}

async function createConversation(payload = {}) {
  const conversation = {
    id: crypto.randomUUID(),
    userId: String(payload.userId || ""),
    userEmail: String(payload.userEmail || ""),
    guestLabel: String(payload.guestLabel || payload.userEmail || "Explorer"),
    status: payload.status || "queued",
    handoffReason: String(payload.handoffReason || ""),
    lastUserMessage: String(payload.lastUserMessage || ""),
    lastAdminMessage: String(payload.lastAdminMessage || ""),
    messages: Array.isArray(payload.messages) ? payload.messages : [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  const mode = await detectMode();
  if (mode === "supabase") {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(TABLE)
      .insert(mapConversationToRow(conversation))
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapRowToConversation(data);
  }

  const rows = readFileRows();
  rows.push(mapConversationToRow(conversation));
  writeFileRows(rows);
  return conversation;
}

async function saveConversation(conversation) {
  const payload = {
    ...conversation,
    id: String(conversation.id),
    messages: Array.isArray(conversation.messages) ? conversation.messages : [],
    updatedAt: nowIso(),
  };
  const row = mapConversationToRow(payload);

  const mode = await detectMode();
  if (mode === "supabase") {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(TABLE)
      .update(row)
      .eq("id", row.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapRowToConversation(data);
  }

  const rows = readFileRows();
  const index = rows.findIndex((item) => String(item.id) === String(row.id));
  if (index >= 0) rows[index] = row;
  else rows.push(row);
  writeFileRows(rows);
  return mapRowToConversation(row);
}

module.exports = {
  listConversations,
  getConversationById,
  createConversation,
  saveConversation,
};

