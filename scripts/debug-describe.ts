import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  content.split("\n").forEach(line => {
    const match = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

// import { pool } from "../src/lib/db";

async function run() {
  const { pool } = await import("../src/lib/db");
  try {
    const [rows] = await pool.query("DESCRIBE vault_comments");
    console.log("DESCRIBE vault_comments:");
    console.log(rows);
    process.exit(0);
  } catch (err) {
    console.error("Describe query error:", err);
    process.exit(1);
  }
}

run();
