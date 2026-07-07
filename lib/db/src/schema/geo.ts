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

export const blocksTable = pgTable("blocks", {
  id: serial("id").primaryKey(),
  districtId: integer("district_id")
    .notNull()
    .references(() => districtsTable.id),
  talukId: integer("taluk_id").references(() => taluksTable.id),
  name: text("name").notNull(),
  nameTa: text("name_ta"),
});

export const insertBlockSchema = createInsertSchema(blocksTable).omit({
  id: true,
});
export type InsertBlock = z.infer<typeof insertBlockSchema>;
export type Block = typeof blocksTable.$inferSelect;

export const panchayatsTable = pgTable("panchayats", {
  id: serial("id").primaryKey(),
  blockId: integer("block_id")
    .notNull()
    .references(() => blocksTable.id),
  name: text("name").notNull(),
  nameTa: text("name_ta"),
});

export const insertPanchayatSchema = createInsertSchema(panchayatsTable).omit({
  id: true,
});
export type InsertPanchayat = z.infer<typeof insertPanchayatSchema>;
export type Panchayat = typeof panchayatsTable.$inferSelect;

export const villagesTable = pgTable("villages", {
  id: serial("id").primaryKey(),
  panchayatId: integer("panchayat_id").references(() => panchayatsTable.id),
  talukId: integer("taluk_id").references(() => taluksTable.id),
  name: text("name").notNull(),
  nameTa: text("name_ta"),
});

export const insertVillageSchema = createInsertSchema(villagesTable).omit({
  id: true,
});
export type InsertVillage = z.infer<typeof insertVillageSchema>;
export type Village = typeof villagesTable.$inferSelect;
