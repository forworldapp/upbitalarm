import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const listings = pgTable("listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  exchange: text("exchange").notNull(), // 'upbit' or 'bithumb'
  listedAt: timestamp("listed_at").notNull(),
  initialPrice: decimal("initial_price"),
  currentPrice: decimal("current_price"),
  priceChangePercent: decimal("price_change_percent"),
  marketId: text("market_id").notNull(),
  notificationSent: boolean("notification_sent").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const notificationSettings = pgTable("notification_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: boolean("email").default(true),
  telegram: boolean("telegram").default(false),
  discord: boolean("discord").default(false),
  pollingInterval: integer("polling_interval").default(600), // seconds
  filterMajorCoinsOnly: boolean("filter_major_coins_only").default(false),
  filterMinMarketCap: decimal("filter_min_market_cap"),
  emailAddress: text("email_address"),
  telegramChatId: text("telegram_chat_id"),
  discordWebhookUrl: text("discord_webhook_url"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const systemStatus = pgTable("system_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  service: text("service").notNull(), // 'upbit', 'bithumb', 'notifications'
  status: text("status").notNull(), // 'healthy', 'error', 'degraded'
  lastCheck: timestamp("last_check").notNull(),
  responseTime: integer("response_time"), // milliseconds
  errorMessage: text("error_message"),
  rateLimit: integer("rate_limit"),
  rateLimitUsed: integer("rate_limit_used"),
});

export const insertListingSchema = createInsertSchema(listings).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSystemStatusSchema = createInsertSchema(systemStatus).omit({
  id: true,
});

export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listings.$inferSelect;

export type InsertNotificationSettings = z.infer<typeof insertNotificationSettingsSchema>;
export type NotificationSettings = typeof notificationSettings.$inferSelect;

export type InsertSystemStatus = z.infer<typeof insertSystemStatusSchema>;
export type SystemStatus = typeof systemStatus.$inferSelect;
