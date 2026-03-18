import fs from "fs";
import path from "path";
import { hashSync } from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { users, roles } from "@/db/schema";

// ─── Environment Management ───────────────────────────────────────────────────
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

const JIRA_HOST = process.env.JIRA_HOST;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_TOKEN = process.env.JIRA_TOKEN;
const SEED_EMAIL = process.env.ADMIN_SEED_EMAIL || "admin@nextdaynutra.local";
const SEED_PASSWORD = process.env.ADMIN_SEED_PASSWORD || "ChangeMe123!";
const SEED_NAME = process.env.ADMIN_SEED_NAME || "NDN Admin";
const SEED_ROLE = process.env.ADMIN_SEED_ROLE || "super_admin";

// ─── Jira Fetch Helper ─────────────────────────────────────────────────────────
async function fetchJiraIssues(jql: string, fields: string[]) {
  if (!JIRA_HOST || !JIRA_EMAIL || !JIRA_TOKEN) throw new Error("Jira credentials not configured");
  
  const authHeader = `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString('base64')}`;
  let allIssues: any[] = [];
  let nextPageToken: string | undefined = undefined;

  console.log(`🔍 Syncing Jira JQL: ${jql}`);

  while (true) {
    const payload: any = { jql, maxResults: 100, fields };
    if (nextPageToken) payload.nextPageToken = nextPageToken;

    const response = await fetch(`${JIRA_HOST}/rest/api/3/search/jql`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jira API failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    allIssues = allIssues.concat(data.issues || []);

    if (data.nextPageToken) {
      nextPageToken = data.nextPageToken;
    } else {
      break;
    }
  }

  return allIssues;
}

// ─── Main Seed Logic ──────────────────────────────────────────────────────────
async function seed() {
  const { db } = await import("@/lib/db");
  
  try {
    console.log("🌱 Starting integrated Jira & Database seed...");
    
    // 1. Ensure Roles Exist
    const requiredRoles = [
      { key: "super_admin", name: "Super Admin", description: "Full system control" },
      { key: "manager", name: "Manager", description: "Manage clients and assets" },
      { key: "agent", name: "Agent", description: "Handle support or customer logs" },
      { key: "customer", name: "Customer", description: "Client account portal access" },
    ];

    for (const r of requiredRoles) {
      const [existing] = await db.select().from(roles).where(eq(roles.key, r.key)).limit(1);
      if (!existing) {
        await db.insert(roles).values({ ...r, isSystem: true });
        console.log(`✅ Role Created: ${r.key}`);
      } else {
        await db.update(roles).set(r).where(eq(roles.key, r.key));
      }
    }

    // 2. Upsert Seed Admin
    const passwordHash = hashSync(SEED_PASSWORD, 12);
    await db.insert(users).values({
      name: SEED_NAME,
      email: SEED_EMAIL.trim().toLowerCase(),
      jiraId: "seed-admin",
      passwordHash,
      role: SEED_ROLE,
      isActive: true,
      redirectUrl: "/",
    }).onDuplicateKeyUpdate({
      set: {
        name: sql`values(name)`,
        email: sql`values(email)`,
        passwordHash: sql`values(password_hash)`,
        role: sql`values(role)`,
      }
    });
    console.log(`⭐️ Admin Synchronized: ${SEED_EMAIL}`);

    // 3. Sync Agents from Jira
    const agentJql = 'project = AGENT AND status = Active AND issuetype = Agent';
    const agentFields = [
      "summary",
      "customfield_11791", // Name
      "customfield_11793", // Email
      "customfield_11792", // Phone
      "customfield_11794", // Company Name
      "customfield_11795", // Address Line 1
      "customfield_11796", // Address Line 2
      "customfield_11797", // City
      "customfield_11798", // State
      "customfield_11799", // Zip
      "customfield_11800", // Country
    ];

    const agentIssues = await fetchJiraIssues(agentJql, agentFields);
    for (const issue of agentIssues) {
      const f = issue.fields;
      const name = f.customfield_11791 || f.summary || "Unknown Agent";
      const email = f.customfield_11793 ? f.customfield_11793.trim().toLowerCase() : null;
      const jiraId = issue.key;

      await db.insert(users).values({
          jiraId,
        name,
        email,
        passwordHash, // default seed password
        role: "agent",
        isActive: true,
        phone: f.customfield_11792 || null,
        companyName: f.customfield_11794 || null,
        addressLine1: f.customfield_11795 || null,
        addressLine2: f.customfield_11796 || null,
        city: f.customfield_11797 || null,
        state: f.customfield_11798 || null,
        zip: f.customfield_11799 || null,
        country: f.customfield_11800 || null,
      }).onDuplicateKeyUpdate({
        set: {
          name: sql`values(name)`,
          email: sql`values(email)`,
          role: sql`values(role)`,
          isActive: sql`values(is_active)`,
          phone: sql`values(phone)`,
          companyName: sql`values(company_name)`,
          addressLine1: sql`values(address_line1)`,
          addressLine2: sql`values(address_line2)`,
          city: sql`values(city)`,
          state: sql`values(state)`,
          zip: sql`values(zip)`,
          country: sql`values(country)`,
        }
      });
    }
    console.log(`👮 Synced ${agentIssues.length} Agents`);

    // 4. Sync Customers & Link Account Managers
    const customerJql = 'project = CUS AND status = Active';
    const customerFields = [
      "summary",
      "customfield_11294", // Customer Name
      "customfield_10270", // Customer Email
      "customfield_11360", // Account Manager Email
      "customfield_11393", // Account Manager Name
    ];

    const customerIssues = await fetchJiraIssues(customerJql, customerFields);
    for (const issue of customerIssues) {
      const f = issue.fields;
      const name = f.customfield_11294 || f.summary || "Unknown Customer";
      const email = f.customfield_10270 ? f.customfield_10270.trim().toLowerCase() : null;
      const amEmail = f.customfield_11360?.trim()?.toLowerCase();
      const amName = f.customfield_11393;
      const jiraId = issue.key;

      let amId: number | null = null;
      if (amEmail) {
        const [mgr] = await db.select({ id: users.id }).from(users).where(eq(users.email, amEmail)).limit(1);
        if (mgr) amId = mgr.id;
        else if (amName) {
           const [mgrByName] = await db.select({ id: users.id }).from(users).where(eq(users.name, amName)).limit(1);
           if (mgrByName) amId = mgrByName.id;
        }
      }

      await db.insert(users).values({
          jiraId,
        name,
        email,
        passwordHash,
        role: "customer",
        isActive: true,
        accountManagerId: amId,
      }).onDuplicateKeyUpdate({
        set: {
          name: sql`values(name)`,
          email: sql`values(email)`,
          role: sql`values(role)`,
          isActive: sql`values(is_active)`,
          accountManagerId: sql`values(account_manager_id)`,
        }
      });
    }
    console.log(`👥 Synced ${customerIssues.length} Customers`);

    console.log("🎉 Seeding and Jira synchronization completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
  } finally {
    process.exit(0);
  }
}

seed();