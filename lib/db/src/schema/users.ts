import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ROLES = [
  "citizen",
  "village_officer",
  "taluk_officer",
  "district_officer",
  "department_officer",
  "ministry_officer",
  "state_administrator",
  "super_admin",
  "investigation_officer",
  "moderator",
  "auditor",
  "legal_officer",
] as const;

export type RoleName = (typeof ROLES)[number];

export const OFFICER_ROLES: RoleName[] = [
  "village_officer",
  "taluk_officer",
  "district_officer",
  "department_officer",
  "ministry_officer",
  "state_administrator",
  "super_admin",
  "investigation_officer",
  "moderator",
  "auditor",
  "legal_officer",
];

export const ADMIN_ROLES: RoleName[] = [
  "state_administrator",
  "super_admin",
  "moderator",
];

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  phone: text("phone").unique(),
  passwordHash: text("password_hash"),
  role: text("role").notNull().default("citizen"),
  departmentId: integer("department_id"),
  districtId: integer("district_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  userId: integer("user_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
export type Session = typeof sessionsTable.$inferSelect;
