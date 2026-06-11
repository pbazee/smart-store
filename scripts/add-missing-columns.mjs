/**
 * Adds columns that exist in prisma/schema.prisma but are missing from the live DB.
 * Uses the pooler URL (port 6543) which is always reachable.
 *
 * Run with:  node scripts/add-missing-columns.mjs
 */
import pg from "pg";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse .env manually (no dotenv dep needed)
const envPath = resolve(__dirname, "../.env");
const envText = readFileSync(envPath, "utf8");
const envVars = Object.fromEntries(
  envText
    .split("\n")
    .filter((l) => l.includes("=") && !l.trimStart().startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, "")];
    })
);

const connectionString = envVars.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL not found in .env");
  process.exit(1);
}

// Strip pgbouncer params that pg driver doesn't understand
// Also remove sslmode so pg v8+ strict SSL parser doesn't override our ssl option
const url = new URL(connectionString);
url.searchParams.delete("pgbouncer");
url.searchParams.delete("connection_limit");
url.searchParams.delete("pool_timeout");
url.searchParams.delete("sslmode");
url.searchParams.delete("connect_timeout");

// Allow Supabase's self-signed cert chain
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const client = new pg.Client({
  connectionString: url.toString(),
  ssl: { rejectUnauthorized: false },
});

const migrations = [
  // Blog table — columns added in schema but missing from DB
  `ALTER TABLE "Blog" ADD COLUMN IF NOT EXISTS "category" TEXT`,
  `ALTER TABLE "Blog" ADD COLUMN IF NOT EXISTS "authorName" TEXT NOT NULL DEFAULT 'Smartest Store KE'`,
  `ALTER TABLE "Blog" ADD COLUMN IF NOT EXISTS "authorAvatarUrl" TEXT`,
  `ALTER TABLE "Blog" ADD COLUMN IF NOT EXISTS "tags" TEXT[] NOT NULL DEFAULT '{}'`,
  `ALTER TABLE "Blog" ADD COLUMN IF NOT EXISTS "metaTitle" TEXT`,
  `ALTER TABLE "Blog" ADD COLUMN IF NOT EXISTS "metaDescription" TEXT`,
  `ALTER TABLE "Blog" ADD COLUMN IF NOT EXISTS "ogImage" TEXT`,
  `ALTER TABLE "Blog" ADD COLUMN IF NOT EXISTS "focusKeyword" TEXT`,
  `ALTER TABLE "Blog" ADD COLUMN IF NOT EXISTS "canonicalUrl" TEXT`,

  // SiteSettings — returnsContent added in schema but missing from DB
  `ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "returnsContent" TEXT`,
];

async function run() {
  console.log("🔌 Connecting to database...");
  await client.connect();
  console.log("✅ Connected.\n");

  for (const sql of migrations) {
    try {
      await client.query(sql);
      console.log(`✅ ${sql}`);
    } catch (err) {
      console.error(`❌ Failed: ${sql}\n   ${err.message}`);
    }
  }

  await client.end();
  console.log("\n🎉 Done! All missing columns have been added.");
}

run().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
