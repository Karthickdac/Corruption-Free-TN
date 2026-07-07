import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  numeric,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { districtsTable, taluksTable } from "./geo";
import { departmentsTable } from "./government";
import { usersTable } from "./users";

export const complaintCategoriesTable = pgTable("complaint_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  nameTa: text("name_ta"),
  description: text("description"),
});

export const insertComplaintCategorySchema = createInsertSchema(
  complaintCategoriesTable,
).omit({ id: true });
export type InsertComplaintCategory = z.infer<
  typeof insertComplaintCategorySchema
>;
export type ComplaintCategory = typeof complaintCategoriesTable.$inferSelect;

export const complaintsTable = pgTable("complaints", {
  id: serial("id").primaryKey(),
  complaintNumber: text("complaint_number").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("submitted"),
  priority: text("priority").notNull().default("medium"),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  userId: integer("user_id").references(() => usersTable.id),
  districtId: integer("district_id").references(() => districtsTable.id),
  talukId: integer("taluk_id").references(() => taluksTable.id),
  departmentId: integer("department_id").references(() => departmentsTable.id),
  categoryId: integer("category_id").references(
    () => complaintCategoriesTable.id,
  ),
  officeName: text("office_name"),
  officerName: text("officer_name"),
  officerDesignation: text("officer_designation"),
  amountInvolved: numeric("amount_involved"),
  incidentDate: text("incident_date"),
  location: text("location"),
  witnesses: text("witnesses"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertComplaintSchema = createInsertSchema(complaintsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type Complaint = typeof complaintsTable.$inferSelect;

export const evidenceTable = pgTable("evidence", {
  id: serial("id").primaryKey(),
  complaintId: integer("complaint_id")
    .notNull()
    .references(() => complaintsTable.id),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type"),
  description: text("description"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const insertEvidenceSchema = createInsertSchema(evidenceTable).omit({
  id: true,
  uploadedAt: true,
});
export type InsertEvidence = z.infer<typeof insertEvidenceSchema>;
export type Evidence = typeof evidenceTable.$inferSelect;
