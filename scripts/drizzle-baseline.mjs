import { existsSync, readFileSync } from "node:fs";
import { loadEnvFile } from "node:process";
import mysql from "mysql2/promise";

if (existsSync(".env")) {
  loadEnvFile(".env");
}

if (existsSync(".env.local")) {
  loadEnvFile(".env.local");
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const journalPath = "./drizzle/meta/_journal.json";
if (!existsSync(journalPath)) {
  throw new Error("drizzle/meta/_journal.json not found. Run `npm run db:generate` first.");
}

const journal = JSON.parse(readFileSync(journalPath, "utf8"));
const latestEntry = journal?.entries?.at?.(-1);

if (!latestEntry) {
  throw new Error("No migration entry found in drizzle/meta/_journal.json");
}

const connection = await mysql.createConnection(connectionString);

try {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS \`__drizzle_migrations\` (
      \`id\` serial primary key,
      \`hash\` text NOT NULL,
      \`created_at\` bigint
    )
  `);

  const [existing] = await connection.execute(
    "SELECT id FROM `__drizzle_migrations` WHERE `created_at` = ? LIMIT 1",
    [latestEntry.when]
  );

  if (Array.isArray(existing) && existing.length > 0) {
    console.log(`Baseline already recorded for ${latestEntry.tag}.`);
  } else {
    await connection.execute(
      "INSERT INTO `__drizzle_migrations` (`hash`, `created_at`) VALUES (?, ?)",
      [latestEntry.tag, latestEntry.when]
    );
    console.log(`Baseline recorded for ${latestEntry.tag}.`);
  }
} finally {
  await connection.end();
}
