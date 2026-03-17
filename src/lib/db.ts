import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@/db/schema";
import fs from "fs";
import path from "path";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const globalForDb = globalThis as typeof globalThis & {
  __ndnMysqlPool?: mysql.Pool;
};

const pool =
  globalForDb.__ndnMysqlPool ??
  mysql.createPool({
    uri: connectionString,
    connectionLimit: 10,
    namedPlaceholders: true,
    ssl: {
      rejectUnauthorized: true,
      ca: fs.readFileSync(path.resolve(process.cwd(), "ca.pem")),
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__ndnMysqlPool = pool;
}

export const db = drizzle(pool, { schema, mode: "default" });
export { pool };
