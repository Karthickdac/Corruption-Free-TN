import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ministriesTable = pgTable("ministries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  nameTa: text("name_ta"),
  ministerName: text("minister_name"),
});

export const insertMinistrySchema = createInsertSchema(ministriesTable).omit({
  id: true,
});
export type InsertMinistry = z.infer<typeof insertMinistrySchema>;
export type Ministry = typeof ministriesTable.$inferSelect;

export const departmentsTable = pgTable("departments", {
  id: serial("id").primaryKey(),
  ministryId: integer("ministry_id").references(() => ministriesTable.id),
  name: text("name").notNull().unique(),
  nameTa: text("name_ta"),
  description: text("description"),
  secretary: text("secretary"),
  commissioner: text("commissioner"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
});

export const insertDepartmentSchema = createInsertSchema(
  departmentsTable,
).omit({ id: true });
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departmentsTable.$inferSelect;
