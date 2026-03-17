// Usage:
//   node scripts/setAdminRole.js <userId> [role]
//
// Example:
//   node scripts/setAdminRole.js 2f6c... admin

require("dotenv").config();
const { getSupabaseClient } = require("../utils/supabaseClient");

async function main() {
  const userId = process.argv[2];
  const role = process.argv[3] || "admin";

  if (!userId) {
    console.error("Missing userId.\n\nUsage: node scripts/setAdminRole.js <userId> [role]");
    process.exit(1);
  }

  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { role },
  });

  if (error) {
    console.error("Failed to update user role:", error.message);
    process.exit(1);
  }

  console.log(`Updated user ${userId} app_metadata.role -> ${role}`);
  console.log("User email:", data?.user?.email);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

