function getDataStore() {
  const v = (process.env.DATA_STORE || "mongo").toLowerCase();
  return v === "supabase" ? "supabase" : "mongo";
}

module.exports = { getDataStore };

