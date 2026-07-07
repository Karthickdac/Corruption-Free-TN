import { Router, type IRouter } from "express";
import { sql, eq, and, gte, lte, ilike, desc, asc, count, or } from "drizzle-orm";
import {
  db,
  complaintsTable,
  districtsTable,
  taluksTable,
  departmentsTable,
  complaintCategoriesTable,
  usersTable,
} from "@workspace/db";
import { SearchComplaintsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/search/complaints", async (req, res, next) => {
  try {
    const {
      q,
      complaintNumber,
      status,
      departmentId,
      districtId,
      talukId,
      categoryId,
      priority,
      from,
      to,
      minAmount,
      maxAmount,
      page: pageStr,
      limit: limitStr,
      sortBy = "createdAt",
      sortDir = "desc",
      format,
    } = req.query as Record<string, string | undefined>;

    const page = Math.max(1, Number(pageStr) || 1);
    const limit = Math.min(Number(limitStr) || 20, 100);
    const offset = (page - 1) * limit;

    const conditions = [];
    if (q) {
      conditions.push(
        or(
          ilike(complaintsTable.title, `%${q}%`),
          ilike(complaintsTable.description, `%${q}%`),
          ilike(complaintsTable.officerName, `%${q}%`),
          ilike(complaintsTable.location, `%${q}%`),
        )!
      );
    }
    if (complaintNumber) conditions.push(ilike(complaintsTable.complaintNumber, `%${complaintNumber}%`));
    if (status) conditions.push(eq(complaintsTable.status, status));
    if (departmentId) conditions.push(eq(complaintsTable.departmentId, Number(departmentId)));
    if (districtId) conditions.push(eq(complaintsTable.districtId, Number(districtId)));
    if (talukId) conditions.push(eq(complaintsTable.talukId, Number(talukId)));
    if (categoryId) conditions.push(eq(complaintsTable.categoryId, Number(categoryId)));
    if (priority) conditions.push(eq(complaintsTable.priority, priority));
    if (from) conditions.push(gte(complaintsTable.createdAt, new Date(from)));
    if (to) {
      const d = new Date(to);
      d.setHours(23, 59, 59, 999);
      conditions.push(lte(complaintsTable.createdAt, d));
    }
    if (minAmount) conditions.push(gte(complaintsTable.amountInvolved, String(minAmount)));
    if (maxAmount) conditions.push(lte(complaintsTable.amountInvolved, String(maxAmount)));

    const where = conditions.length ? and(...conditions) : undefined;

    const sortCol = sortBy === "status" ? complaintsTable.status
      : sortBy === "priority" ? complaintsTable.priority
      : sortBy === "updatedAt" ? complaintsTable.updatedAt
      : complaintsTable.createdAt;
    const order = sortDir === "asc" ? asc(sortCol) : desc(sortCol);

    const [rows, totalRows] = await Promise.all([
      db
        .select({
          complaint: complaintsTable,
          districtName: districtsTable.name,
          talukName: taluksTable.name,
          departmentName: departmentsTable.name,
          categoryName: complaintCategoriesTable.name,
          officerName: usersTable.name,
        })
        .from(complaintsTable)
        .leftJoin(districtsTable, eq(complaintsTable.districtId, districtsTable.id))
        .leftJoin(taluksTable, eq(complaintsTable.talukId, taluksTable.id))
        .leftJoin(departmentsTable, eq(complaintsTable.departmentId, departmentsTable.id))
        .leftJoin(complaintCategoriesTable, eq(complaintsTable.categoryId, complaintCategoriesTable.id))
        .leftJoin(usersTable, eq(complaintsTable.assignedOfficerId, usersTable.id))
        .where(where)
        .orderBy(order)
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(complaintsTable).where(where),
    ]);

    const complaints = rows.map(r => ({
      id: r.complaint.id,
      complaintNumber: r.complaint.complaintNumber,
      title: r.complaint.title,
      description: r.complaint.description,
      status: r.complaint.status,
      priority: r.complaint.priority,
      isAnonymous: r.complaint.isAnonymous,
      districtId: r.complaint.districtId,
      districtName: r.districtName ?? null,
      talukId: r.complaint.talukId,
      talukName: r.talukName ?? null,
      departmentId: r.complaint.departmentId,
      departmentName: r.departmentName ?? null,
      categoryId: r.complaint.categoryId,
      categoryName: r.categoryName ?? null,
      officeName: r.complaint.officeName,
      officerName: r.complaint.officerName,
      village: r.complaint.village,
      location: r.complaint.location,
      amountInvolved: r.complaint.amountInvolved ? Number(r.complaint.amountInvolved) : null,
      incidentDate: r.complaint.incidentDate,
      assignedOfficerId: r.complaint.assignedOfficerId,
      assignedOfficerName: r.officerName ?? null,
      createdAt: r.complaint.createdAt.toISOString(),
    }));

    if (format === "csv") {
      const headers = ["ID", "Number", "Title", "Status", "Priority", "District", "Department", "Category", "Date"];
      const csvRows = [
        headers.join(","),
        ...complaints.map(c =>
          [
            c.id,
            c.complaintNumber,
            `"${c.title.replace(/"/g, '""')}"`,
            c.status,
            c.priority,
            c.districtName ?? "",
            c.departmentName ?? "",
            c.categoryName ?? "",
            c.createdAt.split("T")[0],
          ].join(",")
        ),
      ];
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="complaints-export.csv"`);
      res.send(csvRows.join("\n"));
      return;
    }

    const total = totalRows[0]?.count ?? 0;
    res.json(SearchComplaintsResponse.parse({ results: complaints, total, page, limit }));
  } catch (err) {
    next(err);
  }
});

export default router;
