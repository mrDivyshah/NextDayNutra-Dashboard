import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import mysql from "mysql2/promise";
import { hash } from "bcryptjs";
import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

if (existsSync(".env")) {
  loadEnvFile(".env");
}

if (existsSync(".env.local")) {
  loadEnvFile(".env.local");
}

const connectionString = process.env.DATABASE_URL;
const email = (process.env.ADMIN_SEED_EMAIL || "").trim().toLowerCase();
const password = process.env.ADMIN_SEED_PASSWORD || "";
const name = process.env.ADMIN_SEED_NAME || "NDN Admin";
const role = process.env.ADMIN_SEED_ROLE || "super_admin";

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

if (!email || !password) {
  throw new Error("ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD are required");
}

const roles = mysqlTable(
  "roles",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    key: varchar("key_name", { length: 100 }).notNull(),
    name: varchar("name", { length: 191 }).notNull(),
    description: text("description"),
    isSystem: boolean("is_system").notNull().default(true),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    keyIdx: uniqueIndex("roles_key_idx").on(table.key),
  })
);

const users = mysqlTable(
  "users",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    name: varchar("name", { length: 191 }).notNull(),
    email: varchar("email", { length: 191 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: varchar("role", { length: 100 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
  })
);

const roleSeed = [
  ["super_admin", "Super Admin", "Full access to all users and site settings."],
  ["administrator", "Administrator", "Administrative access to the dashboard."],
  ["account_manager", "Account Manager", "Manages customer accounts."],
  ["customer_agent", "Customer Agent", "Supports customer operations."],
  ["agent", "Agent", "General agent access."],
  ["executive", "Executive", "Executive reporting access."],
  ["customer_team", "Customer Team", "Team member account for customer operations."],
  ["client", "Client", "Client-facing account."],
  ["shop_manager", "Shop manager", "Commerce and store management role."],
  ["customer", "Customer", "Customer portal access."],
  ["subscriber", "Subscriber", "Basic subscribed user."],
  ["contributor", "Contributor", "Contributor access."],
  ["author", "Author", "Author access."],
  ["editor", "Editor", "Editor access."],
  ["manager", "Manager", "Default dashboard manager role."],
].map(([key, label, description]) => ({
  key,
  name: label,
  description,
  isSystem: true,
}));

const connection = await mysql.createConnection(connectionString);
const db = drizzle(connection, { mode: "default" });

try {
  await db
    .insert(roles)
    .values(roleSeed)
    .onDuplicateKeyUpdate({
      set: {
        name: sql`values(name)`,
        description: sql`values(description)`,
        isSystem: sql`values(is_system)`,
      },
    });

  const passwordHash = await hash(password, 12);
  await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash,
      role,
      isActive: true,
    })
    .onDuplicateKeyUpdate({
      set: {
        name: sql`values(name)`,
        passwordHash: sql`values(password_hash)`,
        role: sql`values(role)`,
        isActive: sql`values(is_active)`,
      },
    });

  console.log(`Drizzle seed complete: ${roleSeed.length} roles synced, seed user ready: ${email} (${role})`);
} finally {
  await connection.end();
}
