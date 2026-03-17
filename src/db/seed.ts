import fs from "fs";
import path from "path";
import { hashSync } from "bcryptjs";
import { eq } from "drizzle-orm";
import { users, roles } from "@/db/schema";

// Load environment variables manually for script execution context
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

const SEED_EMAIL = process.env.ADMIN_SEED_EMAIL || "admin@nextdaynutra.local";
const SEED_PASSWORD = process.env.ADMIN_SEED_PASSWORD || "ChangeMe123!";
const SEED_NAME = process.env.ADMIN_SEED_NAME || "NDN Admin";
const SEED_ROLE = process.env.ADMIN_SEED_ROLE || "super_admin";

async function seed() {
  const { db } = await import("@/lib/db");
  try {
    console.log("🌱 Starting database seeding...");
    
    // 1. Ensure the required Roles exist in the database
    const requiredRoles = [
      { key: "super_admin", name: "Super Admin", description: "Full system control" },
      { key: "manager", name: "Manager", description: "Manage clients and assets" },
      { key: "agent", name: "Agent", description: "Handle support or customer logs" },
    ];

    for (const r of requiredRoles) {
      const [existing] = await db.select().from(roles).where(eq(roles.key, r.key)).limit(1);
      if (!existing) {
        await db.insert(roles).values({ ...r, isSystem: true });
        console.log(`✅ Created role: ${r.key}`);
      }
    }

    // 2. Hash Seed Admin Password
    const passwordHash = hashSync(SEED_PASSWORD, 10);

    // 3. Upsert User using SQL onDuplicateKeyUpdate for MySQL integrity
    const [existingAdmin] = await db.select().from(users).where(eq(users.email, SEED_EMAIL)).limit(1);
    const adminUser = {
      name: SEED_NAME,
      email: SEED_EMAIL,
      passwordHash: passwordHash,
      role: SEED_ROLE,
      isActive: true,
      redirectUrl: "/",
    };

    if (existingAdmin) {
      await db.update(users).set(adminUser).where(eq(users.id, existingAdmin.id));
      console.log(`✅ Updated existing seed user: ${SEED_EMAIL}`);
    } else {
      await db.insert(users).values(adminUser);
      console.log(`✅ Inserted seed user: ${SEED_EMAIL}`);
    }

    console.log("🎉 Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
  } finally {
    process.exit(0);
  }
}

seed();