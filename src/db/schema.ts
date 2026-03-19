import {
  bigint,
  boolean,
  int,
  mysqlTable,
  timestamp,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const roles = mysqlTable(
  "roles",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    key: varchar("key_name", { length: 100 }).notNull(),
    name: varchar("name", { length: 191 }).notNull(),
    description: text("description"),
    isSystem: boolean("is_system").notNull().default(true),
    redirectUrl: varchar("redirect_url", { length: 500 }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    keyIdx: uniqueIndex("roles_key_idx").on(table.key),
  })
);

export const users = mysqlTable(
  "users",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    name: varchar("name", { length: 191 }).notNull(),
    email: varchar("email", { length: 191 }),
    jiraId: varchar("jira_id", { length: 100 }),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: varchar("role", { length: 100 }).notNull().default("manager"),
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
    redirectUrl: varchar("redirect_url", { length: 500 }),
    additionalAccess: text("additional_access"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
    jiraIdx: uniqueIndex("users_jira_idx").on(table.jiraId),
  })
);

export const vaultAssets = mysqlTable("vault_assets", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  orderId: varchar("order_id", { length: 100 }).notNull(),
  customerId: int("customer_id").notNull().default(0),
  uploaderId: bigint("uploader_id", { mode: "number", unsigned: true }).notNull(),
  fileUrl: text("file_url").notNull(),
  filePath: text("file_path").notNull(),
  fileName: text("file_name").notNull(),
  mimeType: varchar("mime_type", { length: 150 }).notNull(),
  fileSize: int("file_size").notNull().default(0),
  requiresApproval: boolean("requires_approval").notNull().default(false),
  approvalStatus: varchar("approval_status", { length: 32 }).notNull().default("pending"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const vaultComments = mysqlTable("vault_comments", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  assetId: bigint("asset_id", { mode: "number", unsigned: true }).notNull(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  comment: text("comment").notNull(),
  replyToId: bigint("reply_to_id", { mode: "number", unsigned: true }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const notifications = mysqlTable("notifications", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  type: varchar("type", { length: 50 }).notNull().default("comment"), // comment | file_upload
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  orderId: varchar("order_id", { length: 100 }),
  assetId: bigint("asset_id", { mode: "number", unsigned: true }),
  fromUserId: bigint("from_user_id", { mode: "number", unsigned: true }),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const orderReadStatus = mysqlTable("order_read_status", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  orderId: varchar("order_id", { length: 100 }).notNull(),
  lastReadAt: timestamp("last_read_at", { mode: "date" }).notNull().defaultNow().$onUpdate(() => new Date()),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const passwordResetTokens = mysqlTable(
  "password_reset_tokens",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    tokenHashIdx: uniqueIndex("password_reset_tokens_token_hash_idx").on(table.tokenHash),
  })
);

export type DbUser = typeof users.$inferSelect;
export type DbRole = typeof roles.$inferSelect;
export type NewDbUser = typeof users.$inferInsert;
export type DbVaultAsset = typeof vaultAssets.$inferSelect;
export type DbVaultComment = typeof vaultComments.$inferSelect;
export type DbPasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type DbNotification = typeof notifications.$inferSelect;
export type DbOrderReadStatus = typeof orderReadStatus.$inferSelect;
