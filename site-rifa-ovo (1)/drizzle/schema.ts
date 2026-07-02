import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Rifa Reservations Table
export const rifaReservations = mysqlTable("rifa_reservations", {
  id: int("id").autoincrement().primaryKey(),
  number: int("number").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  pixKey: varchar("pixKey", { length: 255 }).notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "confirmed", "cancelled"]).default("pending").notNull(),
  paymentAmount: int("paymentAmount").notNull(), // Valor em centavos
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RifaReservation = typeof rifaReservations.$inferSelect;
export type InsertRifaReservation = typeof rifaReservations.$inferInsert;

// Rifa Payments Table
export const rifaPayments = mysqlTable("rifa_payments", {
  id: int("id").autoincrement().primaryKey(),
  reservationId: int("reservationId").notNull(),
  amount: int("amount").notNull(), // Valor em centavos
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
  pixKey: varchar("pixKey", { length: 255 }).notNull(),
  transactionId: varchar("transactionId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RifaPayment = typeof rifaPayments.$inferSelect;
export type InsertRifaPayment = typeof rifaPayments.$inferInsert;