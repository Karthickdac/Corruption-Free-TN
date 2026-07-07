import { Router, type IRouter } from "express";
import { sql, eq, desc, count } from "drizzle-orm";
import {
  db,
  complaintsTable,
  districtsTable,
  departmentsTable,
  complaintCategoriesTable,
} from "@workspace/db";
import { GetPublicStatsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stats/public", async (_req, res, next) => {
  try {
    const [byStatus, totalDistricts, totalDepartments, topDistricts, topDepartments, topCategories] =
      await Promise.all([
        db
          .select({ status: complaintsTable.status, count: count() })
          .from(complaintsTable)
          .groupBy(complaintsTable.status),
        db.select({ count: count() }).from(districtsTable),
        db.select({ count: count() }).from(departmentsTable),
        db
          .select({ name: districtsTable.name, count: count() })
          .from(complaintsTable)
          .innerJoin(
            districtsTable,
            eq(complaintsTable.districtId, districtsTable.id),
          )
          .groupBy(districtsTable.name)
          .orderBy(desc(count()))
          .limit(5),
        db
          .select({ name: departmentsTable.name, count: count() })
          .from(complaintsTable)
          .innerJoin(
            departmentsTable,
            eq(complaintsTable.departmentId, departmentsTable.id),
          )
          .groupBy(departmentsTable.name)
          .orderBy(desc(count()))
          .limit(5),
        db
          .select({ name: complaintCategoriesTable.name, count: count() })
          .from(complaintsTable)
          .innerJoin(
            complaintCategoriesTable,
            eq(complaintsTable.categoryId, complaintCategoriesTable.id),
          )
          .groupBy(complaintCategoriesTable.name)
          .orderBy(desc(count()))
          .limit(5),
      ]);

    const statusCount = (status: string) =>
      byStatus.find((s) => s.status === status)?.count ?? 0;
    const totalComplaints = byStatus.reduce((acc, s) => acc + s.count, 0);

    const data = GetPublicStatsResponse.parse({
      totalComplaints,
      resolved: statusCount("resolved"),
      pending:
        statusCount("submitted") + statusCount("under_review"),
      underInvestigation: statusCount("under_investigation"),
      totalDistricts: totalDistricts[0]?.count ?? 0,
      totalDepartments: totalDepartments[0]?.count ?? 0,
      byStatus,
      topDistricts,
      topDepartments,
      topCategories,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
