import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { defineConfig } from "drizzle-kit";

if (existsSync(".env")) {
  loadEnvFile(".env");
}

if (existsSync(".env.local")) {
  loadEnvFile(".env.local");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
  seed: {
    schema: "./src/db/schema.ts",
    output: "./src/db/seed.ts",
  },
});
