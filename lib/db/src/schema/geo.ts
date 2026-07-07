import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const districtsTable = pgTable("districts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  nameTa: text("name_ta").notNull(),
  code: text("code").notNull().unique(),
});

export const insertDistrictSchema = createInsertSchema(districtsTable).omit({
  id: true,
});
export type InsertDistrict = z.infer<typeof insertDistrictSchema>;
export type District = typeof districtsTable.$inferSelect;

export const taluksTable = pgTable("taluks", {
  id: serial("id").primaryKey(),
  districtId: integer("district_id")
    .notNull()
    .references(() => districtsTable.id),
  name: text("name").notNull(),
  nameTa: text("name_ta"),
});

export const insertTalukSchema = createInsertSchema(taluksTable).omit({
  id: true,
});
export type InsertTaluk = z.infer<typeof insertTalukSchema>;
export type Taluk = typeof taluksTable.$inferSelect;
