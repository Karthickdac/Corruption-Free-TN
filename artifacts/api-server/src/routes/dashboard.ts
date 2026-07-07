import { Router, type IRouter } from "express";
import { eq, desc, and, count, type SQL } from "drizzle-orm";
import {
  db,
  complaintsTable,
  districtsTable,
  taluksTable,
  departmentsTable,
  complaintCategoriesTable,
  usersTable,
} from "@workspace/db";
import {
  GetDashboardComplaintsQueryParams,
  GetDashboardComplaintsResponse,
} from "@workspace/api-zod";
import { requireAnyOfficer } from "../middlewares/rbac";

const router: IRouter = Router();

function complaintSelection() {
  return db
    .select({
      complaint: complaintsTable,
      districtName: districtsTable.name,
      talukName: taluksTable.name,
      departmentName: departmentsTable.name,
      categoryName: complaintCategoriesTable.name,
      assignedOfficerName: usersTable.name,
    })
    .from(complaintsTable)
    .leftJoin(districtsTable, eq(complaintsTable.districtId, districtsTable.id))
    .leftJoin(taluksTable, eq(complaintsTable.talukId, taluksTable.id))
    .leftJoin(departmentsTable, eq(complaintsTable.departmentId, departmentsTable.id))
    .leftJoin(complaintCategoriesTable, eq(complaintsTable.categoryId, complaintCategoriesTable.id))
    .leftJoin(usersTable, eq(complaintsTable.assignedOfficerId, usersTable.id));
}

function toApiComplaint(row: {
  complaint: typeof complaintsTable.$inferSelect;
  districtName: string | null;
  talukName: string | null;
  departmentName: string | null;
  categoryName: string | null;
  assignedOfficerName: string | null;
}) {
  const c = row.complaint;
  return {
    id: c.id,
    complaintNumber: c.complaintNumber,
    title: c.title,
    description: c.description,
    status: c.status,
    priority: c.priority,
    isAnonymous: c.isAnonymous,
    districtId: c.districtId,
    districtName: row.districtName,
    talukId: c.talukId,
    talukName: row.talukName,
    departmentId: c.departmentId,
    departmentName: row.departmentName,
    categoryId: c.categoryId,
    categoryName: row.categoryName,
    officeName: c.officeName,
    officerName: c.officerName,
    village: c.village,
    location: c.location,
    amountInvolved: c.amountInvolved === null ? null : Number(c.amountInvolved),
    incidentDate: c.incidentDate,
    assignedOfficerId: c.assignedOfficerId,
    assignedOfficerName: row.assignedOfficerName,
    statusHistory: [],
    createdAt: c.createdAt.toISOString(),
  };
}

router.get(
  "/dashboard/complaints",
  requireAnyOfficer(),
  async (req, res, next) => {
    try {
      const user = req.localUser!;
      const params = GetDashboardComplaintsQueryParams.safeParse(req.query);
      const status = params.success ? params.data.status : undefined;
      const priority = params.success ? params.data.priority : undefined;
      const assignedToMe = params.success ? params.data.assignedToMe : undefined;
      const limit = params.success ? (params.data.limit ?? 50) : 50;
      const offset = params.success ? (params.data.offset ?? 0) : 0;

      const conditions: SQL[] = [];

      if (
        user.role === "department_officer" ||
        user.role === "ministry_officer"
      ) {
        if (user.departmentId) {
          conditions.push(eq(complaintsTable.departmentId, user.departmentId));
        }
      } else if (
        user.role === "district_officer" ||
        user.role === "taluk_officer" ||
        user.role === "village_officer"
      ) {
        if (user.districtId) {
          conditions.push(eq(complaintsTable.districtId, user.districtId));
        }
      }

      if (status) conditions.push(eq(complaintsTable.status, status));
      if (priority) conditions.push(eq(complaintsTable.priority, priority));
      if (assignedToMe === true) {
        conditions.push(eq(complaintsTable.assignedOfficerId, user.id));
      }

      const whereClause = conditions.length ? and(...conditions) : undefined;

      const [rows, totalResult] = await Promise.all([
        complaintSelection()
          .where(whereClause)
          .orderBy(desc(complaintsTable.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: count() })
          .from(complaintsTable)
          .where(whereClause),
      ]);

      const allComplaints = await complaintSelection()
        .where(conditions.length > 0 && (status || priority || assignedToMe)
          ? (conditions.filter(c =>
              !status || c !== eq(complaintsTable.status, status)
            ).length ? and(...conditions.filter((_, i) => {
              const baseCondLen = conditions.length - (status ? 1 : 0) - (priority ? 1 : 0) - (assignedToMe ? 1 : 0);
              return i < baseCondLen;
            })) : undefined)
          : whereClause
        );

      const statuses = ["submitted", "under_review", "investigation", "action_taken", "closed", "rejected"];
      const stats: Record<string, number> = {};
      for (const s of statuses) stats[s] = 0;
      for (const r of allComplaints) {
        const s = r.complaint.status;
        if (s in stats) stats[s]++;
      }

      const total = totalResult[0]?.count ?? 0;
      res.json(
        GetDashboardComplaintsResponse.parse({
          complaints: rows.map(toApiComplaint),
          total,
          stats: {
            submitted: stats["submitted"] ?? 0,
            under_review: stats["under_review"] ?? 0,
            investigation: stats["investigation"] ?? 0,
            action_taken: stats["action_taken"] ?? 0,
            closed: stats["closed"] ?? 0,
            rejected: stats["rejected"] ?? 0,
          },
        }),
      );
    } catch (err) {
      next(err);
    }
  },
);

export default router;
