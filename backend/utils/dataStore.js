function getDataStore() {
  const v = (process.env.DATA_STORE || "supabase").toLowerCase();
  return v === "supabase" ? "supabase" : "mongo";
}

module.exports = { getDataStore };

