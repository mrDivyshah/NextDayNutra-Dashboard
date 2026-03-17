import fs from "fs";
import path from "path";

// Load dotenv manually
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

console.log("envPath:", envPath, "DATABASE_URL exists:", !!process.env.DATABASE_URL);

// import { db } from "../src/lib/db";
// import { vaultAssets } from "../src/db/schema";

async function run() {
  const { db } = await import("../src/lib/db");
  const { vaultAssets } = await import("../src/db/schema");
  try {
    const result = await db.insert(vaultAssets).values({
      orderId: "cm-1641",
      customerId: 999,
      uploaderId: 1,
      fileUrl: "/uploads/vault/cm-1641/buy-stripe-com_evq6oi3du39r0nq4iu1sq0k_locale-en-gb-__embed_source-buy_btn_1t9ld-af68a077-fbb8-4e4c-a9ec-becc27f52cc9.png",
      filePath: "C:\\DivySApp\\ndnAdminDashboard\\my-app\\public\\uploads\\vault\\cm-1641\\buy-stripe-com_evq6oi3du39r0nq4iu1sq0k_locale-en-gb-__embed_source-buy_btn_1t9ld-af68a077-fbb8-4e4c-a9ec-becc27f52cc9.png",
      fileName: "buy.stripe.com_eVq6oI3du39r0Nq4iU1sQ0k_locale=en-GB&__embed_source=buy_btn_1T9ldYIz0RvcPBNsV7cS58se(iPhone SE).png",
      mimeType: "image/png",
      fileSize: 421970,
      requiresApproval: true,
      approvalStatus: "pending",
    });
    console.log("Success:", result);
  } catch (err) {
    console.error("Failed query error:", err);
  }
}

run();
