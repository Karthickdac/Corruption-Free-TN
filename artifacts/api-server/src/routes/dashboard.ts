import { Router, type IRouter } from "express";
import { eq, desc, and, count, inArray, type SQL } from "drizzle-orm";
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
  GetOfficerDashboardResponse,
  ListAssignableOfficersResponse,
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

/**
 * Build jurisdiction WHERE clauses for the current user.
 * Returns `forbidden: true` if the user has a scoped role but no matching
 * department/district ID — callers must return 403 in that case instead of
 * falling through to an unscoped query.
 */
function buildJurisdictionConditions(user: NonNullable<Express.Request["localUser"]>): {
  conditions: SQL[];
  forbidden: boolean;
} {
  if (user.role === "department_officer" || user.role === "ministry_officer") {
    if (!user.departmentId) {
      return { conditions: [], forbidden: true };
    }
    return {
      conditions: [eq(complaintsTable.departmentId, user.departmentId)],
      forbidden: false,
    };
  }

  if (
    user.role === "district_officer" ||
    user.role === "taluk_officer" ||
    user.role === "village_officer"
  ) {
    if (!user.districtId) {
      return { conditions: [], forbidden: true };
    }
    return {
      conditions: [eq(complaintsTable.districtId, user.districtId)],
      forbidden: false,
    };
  }

  if (user.role === "investigation_officer") {
    return {
      conditions: [eq(complaintsTable.assignedOfficerId, user.id)],
      forbidden: false,
    };
  }

  // state_administrator, super_admin, moderator, legal_officer, auditor — no restriction
  return { conditions: [], forbidden: false };
}

router.get(
  "/dashboard/complaints",
  requireAnyOfficer(),
  async (req, res, next) => {
    try {
      const user = req.localUser!;
      const { conditions: jurisdictionConditions, forbidden } = buildJurisdictionConditions(user);

      if (forbidden) {
        res.status(403).json({
          error:
            "Your account is not configured with a valid jurisdiction. Contact your administrator.",
        });
        return;
      }

      const params = GetDashboardComplaintsQueryParams.safeParse(req.query);
      const status = params.success ? params.data.status : undefined;
      const priority = params.success ? params.data.priority : undefined;
      const assignedToMe = params.success ? params.data.assignedToMe : undefined;
      const limit = params.success ? (params.data.limit ?? 50) : 50;
      const offset = params.success ? (params.data.offset ?? 0) : 0;

      const filterConditions: SQL[] = [...jurisdictionConditions];
      if (status) filterConditions.push(eq(complaintsTable.status, status));
      if (priority) filterConditions.push(eq(complaintsTable.priority, priority));
      if (assignedToMe === true) {
        filterConditions.push(eq(complaintsTable.assignedOfficerId, user.id));
      }

      const whereClause = filterConditions.length ? and(...filterConditions) : undefined;
      const statsWhereClause = jurisdictionConditions.length
        ? and(...jurisdictionConditions)
        : undefined;

      const [rows, totalResult, allForStats] = await Promise.all([
        complaintSelection()
          .where(whereClause)
          .orderBy(desc(complaintsTable.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() }).from(complaintsTable).where(whereClause),
        db
          .select({ status: complaintsTable.status })
          .from(complaintsTable)
          .where(statsWhereClause),
      ]);

      const statuses = ["submitted", "under_review", "investigation", "action_taken", "closed", "rejected"];
      const stats: Record<string, number> = {};
      for (const s of statuses) stats[s] = 0;
      for (const r of allForStats) {
        const s = r.status;
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

router.get(
  "/dashboard/officer",
  requireAnyOfficer(),
  async (req, res, next) => {
    try {
      const user = req.localUser!;
      const { conditions: jurisdictionConditions, forbidden } = buildJurisdictionConditions(user);

      if (forbidden) {
        res.status(403).json({
          error:
            "Your account is not configured with a valid jurisdiction. Contact your administrator.",
        });
        return;
      }

      const OPEN_STATUSES = [
        "submitted",
        "under_review",
        "evidence_verification",
        "forwarded",
        "department_response",
        "investigation",
        "reopened",
      ];
      const CLOSED_STATUSES = ["closed", "action_taken", "rejected"];

      const whereAll = jurisdictionConditions.length ? and(...jurisdictionConditions) : undefined;
      const whereOpen = and(
        ...(jurisdictionConditions.length ? jurisdictionConditions : []),
        inArray(complaintsTable.status, OPEN_STATUSES),
      );
      const whereClosed = and(
        ...(jurisdictionConditions.length ? jurisdictionConditions : []),
        inArray(complaintsTable.status, CLOSED_STATUSES),
      );

      const [totalResult, openResult, closedResult, recent] = await Promise.all([
        db.select({ count: count() }).from(complaintsTable).where(whereAll),
        db.select({ count: count() }).from(complaintsTable).where(whereOpen),
        db.select({ count: count() }).from(complaintsTable).where(whereClosed),
        complaintSelection()
          .where(whereAll)
          .orderBy(desc(complaintsTable.createdAt))
          .limit(5),
      ]);

      res.json(
        GetOfficerDashboardResponse.parse({
          totalAssigned: totalResult[0]?.count ?? 0,
          openCount: openResult[0]?.count ?? 0,
          closedCount: closedResult[0]?.count ?? 0,
          recentComplaints: recent.map(toApiComplaint),
        }),
      );
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/dashboard/assignable-officers",
  requireAnyOfficer(),
  async (_req, res, next) => {
    try {
      const rows = await db
        .select({
          id: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
        })
        .from(usersTable)
        .where(eq(usersTable.role, "investigation_officer"))
        .orderBy(usersTable.name);
      res.json(ListAssignableOfficersResponse.parse(rows));
    } catch (err) {
      next(err);
    }
  },
);

export default router;
