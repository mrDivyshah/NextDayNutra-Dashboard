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

const connectionString = process.env.DATABASE_URL;
const jiraHost = process.env.JIRA_HOST;
const jiraEmail = process.env.JIRA_EMAIL;
const jiraToken = process.env.JIRA_TOKEN;
const defaultPassword = process.env.ADMIN_SEED_PASSWORD || "ChangeMe123!";

if (!connectionString) throw new Error("DATABASE_URL is required");
if (!jiraHost || !jiraEmail || !jiraToken) throw new Error("Jira credentials are required in .env");

// Re-define schema for the script (synchronized with src/db/schema.ts)
const users = mysqlTable(
  "users",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    name: varchar("name", { length: 191 }).notNull(),
    email: varchar("email", { length: 191 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: varchar("role", { length: 100 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    phone: varchar("phone", { length: 50 }),
    companyName: varchar("company_name", { length: 191 }),
    addressLine1: varchar("address_line1", { length: 255 }),
    addressLine2: varchar("address_line2", { length: 255 }),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 100 }),
    zip: varchar("zip", { length: 20 }),
    country: varchar("country", { length: 100 }),
    accountManagerId: bigint("account_manager_id", { mode: "number", unsigned: true }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
  })
);

async function fetchJiraIssues(jql, fields) {
  const authHeader = `Basic ${Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64')}`;
  let allIssues = [];
  let nextPageToken = undefined;

  console.log(`🔍 Fetching Jira issues with JQL: ${jql}`);

  while (true) {
    const payload = {
      jql,
      maxResults: 100,
      fields,
    };
    if (nextPageToken) payload.nextPageToken = nextPageToken;
    console.log(payload);
    const response = await fetch(`${jiraHost}/rest/api/3/search/jql`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Jira API error: ${response.status} - ${error}`);
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

// Helper to find manager by email among inserted users or current db users
async function findManagerId(db, email, fallbackName) {
  if (!email) return null;
  const normalizedEmail = email.trim().toLowerCase();
  
  const [manager] = await db.select({ id: users.id }).from(users).where(sql`${users.email} = ${normalizedEmail}`).limit(1);
  return manager ? manager.id : null;
}

async function runSeed() {
  const connection = await mysql.createConnection(connectionString);
  const db = drizzle(connection, { mode: "default" });
  const passwordHash = await hash(defaultPassword, 12);

  try {
    // 1. Fetch Agents
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
    console.log(`👮 Found ${agentIssues.length} agents in Jira`);

    // First insert agents so we have them in the DB (though customers link to Account Managers, agents might be mentioned too)
    for (const issue of agentIssues) {
      const f = issue.fields;
      const name = f.customfield_11791 || f.summary || "Unknown Agent";
      const email = f.customfield_11793 || `${name.replace(/[^a-zA-Z0-9]/g, '.').toLowerCase()}@nextdaynutra.com`;

      await db
        .insert(users)
        .values({
          name,
          email: email.trim().toLowerCase(),
          passwordHash,
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
        })
        .onDuplicateKeyUpdate({
          set: {
            name: sql`values(name)`,
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
          },
        });
    }

    // 2. Fetch Customers
    const customerJql = 'project = CUS AND status = Active';
    const customerFields = [
      "summary",
      "customfield_11294", // Customer Name
      "customfield_10270", // Customer Email
      "customfield_11360", // Account Manager Email
      "customfield_11393", // Account Manager Name
    ];
    const customerIssues = await fetchJiraIssues(customerJql, customerFields);
    console.log(`👥 Found ${customerIssues.length} customers in Jira`);

    // Process Customers
    for (const issue of customerIssues) {
      const f = issue.fields;
      const name = f.customfield_11294 || f.summary || "Unknown Customer";
      const email = f.customfield_10270 || `${name.replace(/[^a-zA-Z0-9]/g, '.').toLowerCase()}@nextdaynutra.com`;
      const amEmail = f.customfield_11360;
      const amName = f.customfield_11393;

      let amId = null;
      if (amEmail) {
        amId = await findManagerId(db, amEmail, amName);
        if (!amId && amName) {
          // Check by name if email lookup failed
          const [managerByName] = await db.select({ id: users.id }).from(users).where(sql`${users.name} = ${amName}`).limit(1);
          if (managerByName) amId = managerByName.id;
        }
      }

      await db
        .insert(users)
        .values({
          name,
          email: email.trim().toLowerCase(),
          passwordHash,
          role: "customer",
          isActive: true,
          accountManagerId: amId,
        })
        .onDuplicateKeyUpdate({
          set: {
            name: sql`values(name)`,
            role: sql`values(role)`,
            isActive: sql`values(is_active)`,
            accountManagerId: sql`values(account_manager_id)`,
          },
        });
    }

    console.log("✅ Custom user sync complete!");

  } catch (error) {
    console.error("❌ Sync failed:", error);
  } finally {
    await connection.end();
  }
}

runSeed();
