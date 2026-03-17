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

async function run() {
  const { db } = await import("../src/lib/db");
  const { vaultComments } = await import("../src/db/schema");
  try {
    const result = await db.insert(vaultComments).values({
      assetId: 1, // asset id 1 created in debug-insert.ts
      userId: 1,  
      comment: "Test Comment from debug script",
    }).$returningId();
    console.log("Success with returningId:", result);
  } catch (err) {
    console.error("Failed comments query error with returningId:", err);
    try {
        const altResult = await db.insert(vaultComments).values({
          assetId: 1,
          userId: 1,
          comment: "Test Comment alt from debug script",
        });
        console.log("Success without returningId:", altResult);
    } catch (altErr) {
        console.error("Failed comments query error without returningId:", altErr);
    }
  }
}

run();
