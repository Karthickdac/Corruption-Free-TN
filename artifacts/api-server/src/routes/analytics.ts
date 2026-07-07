import { Router, type IRouter } from "express";
import { sql, eq, desc, count, avg, and, gte, lte, inArray } from "drizzle-orm";
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
  GetAnalyticsOverviewResponse,
  GetAnalyticsDepartmentPerformanceResponse,
  GetAnalyticsOfficerPerformanceResponse,
  GetAnalyticsTrendsResponse,
  GetAnalyticsMapDataResponse,
} from "@workspace/api-zod";
import { requireAnyOfficer } from "../middlewares/rbac";

const router: IRouter = Router();

const RESOLVED_STATUSES = ["closed", "action_taken"];
const PENDING_STATUSES = ["submitted", "under_review", "evidence_verification", "forwarded", "department_response", "reopened"];

function dateFilter(from?: string, to?: string) {
  const conds = [];
  if (from) conds.push(gte(complaintsTable.createdAt, new Date(from)));
  if (to) {
    const d = new Date(to);
    d.setHours(23, 59, 59, 999);
    conds.push(lte(complaintsTable.createdAt, d));
  }
  return conds;
}

router.get("/analytics/overview", async (req, res, next) => {
  try {
    const { from, to } = req.query as Record<string, string | undefined>;
    const dateConds = dateFilter(from, to);

    const [byStatus, byCategory, byDistrict, byDepartment, byPriority, avgResRows] =
      await Promise.all([
        db
          .select({ name: complaintsTable.status, count: count() })
          .from(complaintsTable)
          .where(dateConds.length ? and(...dateConds) : undefined)
          .groupBy(complaintsTable.status),
        db
          .select({ name: complaintCategoriesTable.name, count: count() })
          .from(complaintsTable)
          .innerJoin(complaintCategoriesTable, eq(complaintsTable.categoryId, complaintCategoriesTable.id))
          .where(dateConds.length ? and(...dateConds) : undefined)
          .groupBy(complaintCategoriesTable.name)
          .orderBy(desc(count()))
          .limit(10),
        db
          .select({ name: districtsTable.name, count: count() })
          .from(complaintsTable)
          .innerJoin(districtsTable, eq(complaintsTable.districtId, districtsTable.id))
          .where(dateConds.length ? and(...dateConds) : undefined)
          .groupBy(districtsTable.name)
          .orderBy(desc(count()))
          .limit(10),
        db
          .select({ name: departmentsTable.name, count: count() })
          .from(complaintsTable)
          .innerJoin(departmentsTable, eq(complaintsTable.departmentId, departmentsTable.id))
          .where(dateConds.length ? and(...dateConds) : undefined)
          .groupBy(departmentsTable.name)
          .orderBy(desc(count()))
          .limit(10),
        db
          .select({ name: complaintsTable.priority, count: count() })
          .from(complaintsTable)
          .where(dateConds.length ? and(...dateConds) : undefined)
          .groupBy(complaintsTable.priority),
        db.execute(sql`
          SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400) as avg_days
          FROM complaints
          WHERE status IN ('closed', 'action_taken')
          ${from ? sql`AND created_at >= ${new Date(from)}` : sql``}
          ${to ? sql`AND created_at <= ${new Date(to)}` : sql``}
        `),
      ]);

    const totalComplaints = byStatus.reduce((a, s) => a + s.count, 0);
    const resolved = byStatus.filter(s => RESOLVED_STATUSES.includes(s.name)).reduce((a, s) => a + s.count, 0);
    const pending = byStatus.filter(s => PENDING_STATUSES.includes(s.name)).reduce((a, s) => a + s.count, 0);
    const underInvestigation = byStatus.find(s => s.name === "investigation")?.count ?? 0;
    const avgDays = Number(avgResRows.rows?.[0]?.avg_days ?? null) || null;

    res.json(GetAnalyticsOverviewResponse.parse({
      totalComplaints,
      resolved,
      pending,
      underInvestigation,
      avgResolutionDays: avgDays,
      byStatus: byStatus.map(s => ({ name: s.name, count: s.count })),
      byCategory,
      byDistrict,
      byDepartment,
      byPriority: byPriority.map(p => ({ name: p.name, count: p.count })),
    }));
  } catch (err) {
    next(err);
  }
});

router.get("/analytics/department-performance", async (req, res, next) => {
  try {
    const { from, to, limit: limitStr } = req.query as Record<string, string | undefined>;
    const dateConds = dateFilter(from, to);
    const limitN = Math.min(Number(limitStr) || 20, 100);

    const rows = await db
      .select({
        departmentId: departmentsTable.id,
        departmentName: departmentsTable.name,
        status: complaintsTable.status,
        count: count(),
      })
      .from(complaintsTable)
      .innerJoin(departmentsTable, eq(complaintsTable.departmentId, departmentsTable.id))
      .where(dateConds.length ? and(...dateConds) : undefined)
      .groupBy(departmentsTable.id, departmentsTable.name, complaintsTable.status);

    const avgRows = await db.execute(sql`
      SELECT d.id as dept_id,
             AVG(EXTRACT(EPOCH FROM (c.updated_at - c.created_at)) / 86400) as avg_days
      FROM complaints c
      JOIN departments d ON c.department_id = d.id
      WHERE c.status IN ('closed', 'action_taken')
      GROUP BY d.id
    `);
    const avgByDept: Record<number, number | null> = {};
    for (const r of avgRows.rows ?? []) {
      avgByDept[r.dept_id as number] = r.avg_days ? Number(r.avg_days) : null;
    }

    const byDept: Record<number, { departmentId: number; departmentName: string; total: number; resolved: number; pending: number }> = {};
    for (const row of rows) {
      if (!byDept[row.departmentId]) {
        byDept[row.departmentId] = { departmentId: row.departmentId, departmentName: row.departmentName, total: 0, resolved: 0, pending: 0 };
      }
      byDept[row.departmentId].total += row.count;
      if (RESOLVED_STATUSES.includes(row.status)) byDept[row.departmentId].resolved += row.count;
      if (PENDING_STATUSES.includes(row.status)) byDept[row.departmentId].pending += row.count;
    }

    const result = Object.values(byDept)
      .map(d => ({
        ...d,
        resolutionRate: d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0,
        avgResolutionDays: avgByDept[d.departmentId] ?? null,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limitN);

    res.json(GetAnalyticsDepartmentPerformanceResponse.parse(result));
  } catch (err) {
    next(err);
  }
});

router.get("/analytics/officer-performance", async (req, res, next) => {
  try {
    const { from, to, limit: limitStr } = req.query as Record<string, string | undefined>;
    const dateConds = dateFilter(from, to);
    const limitN = Math.min(Number(limitStr) || 20, 100);

    const rows = await db
      .select({
        officerId: usersTable.id,
        officerName: usersTable.name,
        officerEmail: usersTable.email,
        status: complaintsTable.status,
        count: count(),
      })
      .from(complaintsTable)
      .innerJoin(usersTable, eq(complaintsTable.assignedOfficerId, usersTable.id))
      .where(dateConds.length ? and(...dateConds) : undefined)
      .groupBy(usersTable.id, usersTable.name, usersTable.email, complaintsTable.status);

    const avgRows = await db.execute(sql`
      SELECT u.id as officer_id,
             AVG(EXTRACT(EPOCH FROM (c.updated_at - c.created_at)) / 86400) as avg_days
      FROM complaints c
      JOIN users u ON c.assigned_officer_id = u.id
      WHERE c.status IN ('closed', 'action_taken')
      GROUP BY u.id
    `);
    const avgByOfficer: Record<number, number | null> = {};
    for (const r of avgRows.rows ?? []) {
      avgByOfficer[r.officer_id as number] = r.avg_days ? Number(r.avg_days) : null;
    }

    const byOfficer: Record<number, { officerId: number; officerName: string | null; officerEmail: string | null; total: number; resolved: number; pending: number }> = {};
    for (const row of rows) {
      if (!byOfficer[row.officerId]) {
        byOfficer[row.officerId] = { officerId: row.officerId, officerName: row.officerName, officerEmail: row.officerEmail, total: 0, resolved: 0, pending: 0 };
      }
      byOfficer[row.officerId].total += row.count;
      if (RESOLVED_STATUSES.includes(row.status)) byOfficer[row.officerId].resolved += row.count;
      if (PENDING_STATUSES.includes(row.status)) byOfficer[row.officerId].pending += row.count;
    }

    const result = Object.values(byOfficer)
      .map(o => ({ ...o, avgResolutionDays: avgByOfficer[o.officerId] ?? null }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limitN);

    res.json(GetAnalyticsOfficerPerformanceResponse.parse(result));
  } catch (err) {
    next(err);
  }
});

router.get("/analytics/trends", async (req, res, next) => {
  try {
    const { granularity = "monthly", from, to } = req.query as Record<string, string | undefined>;
    const fmt = granularity === "yearly" ? "YYYY" : "YYYY-MM";

    const rows = await db.execute(sql`
      SELECT TO_CHAR(created_at, ${fmt}) as period,
             COUNT(*) as total,
             COUNT(*) FILTER (WHERE status IN ('closed', 'action_taken')) as resolved
      FROM complaints
      ${from ? sql`WHERE created_at >= ${new Date(from)}` : sql``}
      ${from && to ? sql`AND created_at <= ${new Date(to)}` : (to ? sql`WHERE created_at <= ${new Date(to)}` : sql``)}
      GROUP BY period
      ORDER BY period ASC
      LIMIT 60
    `);

    const result = (rows.rows ?? []).map((r: any) => ({
      period: String(r.period),
      total: Number(r.total),
      resolved: Number(r.resolved),
      resolutionRate: Number(r.total) > 0 ? Math.round((Number(r.resolved) / Number(r.total)) * 100) : 0,
    }));

    res.json(GetAnalyticsTrendsResponse.parse(result));
  } catch (err) {
    next(err);
  }
});

router.get("/analytics/map-data", async (req, res, next) => {
  try {
    const rows = await db
      .select({
        districtId: districtsTable.id,
        districtName: districtsTable.name,
        districtCode: districtsTable.code,
        status: complaintsTable.status,
        count: count(),
      })
      .from(complaintsTable)
      .innerJoin(districtsTable, eq(complaintsTable.districtId, districtsTable.id))
      .groupBy(districtsTable.id, districtsTable.name, districtsTable.code, complaintsTable.status);

    const allDistricts = await db.select().from(districtsTable);

    const byDistrict: Record<number, { districtId: number; districtName: string; districtCode: string; total: number; resolved: number; pending: number }> = {};

    for (const d of allDistricts) {
      byDistrict[d.id] = { districtId: d.id, districtName: d.name, districtCode: d.code, total: 0, resolved: 0, pending: 0 };
    }
    for (const row of rows) {
      if (!byDistrict[row.districtId]) continue;
      byDistrict[row.districtId].total += row.count;
      if (RESOLVED_STATUSES.includes(row.status)) byDistrict[row.districtId].resolved += row.count;
      if (PENDING_STATUSES.includes(row.status)) byDistrict[row.districtId].pending += row.count;
    }

    const allData = Object.values(byDistrict);
    const maxTotal = Math.max(...allData.map(d => d.total), 1);

    const result = allData.map(d => ({
      ...d,
      density: Math.round((d.total / maxTotal) * 100) / 100,
    }));

    res.json(GetAnalyticsMapDataResponse.parse(result));
  } catch (err) {
    next(err);
  }
});

router.get("/analytics/villages", async (req, res, next) => {
  try {
    const { districtId, talukId } = req.query as Record<string, string | undefined>;
    if (!districtId) {
      res.status(400).json({ error: "districtId is required" });
      return;
    }
    const conds = [
      eq(complaintsTable.districtId, Number(districtId)),
      sql`${complaintsTable.village} IS NOT NULL AND ${complaintsTable.village} != ''`,
    ];
    if (talukId) conds.push(eq(complaintsTable.talukId, Number(talukId)));

    const rows = await db
      .select({
        village: complaintsTable.village,
        total: count(),
        resolved: sql<number>`COUNT(*) FILTER (WHERE ${complaintsTable.status} IN ('closed','action_taken'))`,
      })
      .from(complaintsTable)
      .where(and(...conds))
      .groupBy(complaintsTable.village)
      .orderBy(desc(count()))
      .limit(30);

    res.json(rows.map(r => ({
      village: r.village as string,
      total: r.total,
      resolved: Number(r.resolved),
    })));
  } catch (err) {
    next(err);
  }
});

export default router;
