import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import {
  db,
  districtsTable,
  taluksTable,
  ministriesTable,
  departmentsTable,
  complaintCategoriesTable,
} from "@workspace/db";
import {
  ListDistrictsResponse,
  ListTaluksByDistrictResponse,
  ListMinistriesResponse,
  ListDepartmentsResponse,
  ListDepartmentsQueryParams,
  ListComplaintCategoriesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/districts", async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(districtsTable)
      .orderBy(asc(districtsTable.name));
    res.json(ListDistrictsResponse.parse(rows));
  } catch (err) {
    next(err);
  }
});

router.get("/districts/:districtId/taluks", async (req, res, next) => {
  try {
    const districtId = Number(req.params.districtId);
    if (!Number.isInteger(districtId)) {
      res.status(404).json({ error: "District not found" });
      return;
    }
    const district = await db
      .select({ id: districtsTable.id })
      .from(districtsTable)
      .where(eq(districtsTable.id, districtId));
    if (district.length === 0) {
      res.status(404).json({ error: "District not found" });
      return;
    }
    const rows = await db
      .select()
      .from(taluksTable)
      .where(eq(taluksTable.districtId, districtId))
      .orderBy(asc(taluksTable.name));
    res.json(ListTaluksByDistrictResponse.parse(rows));
  } catch (err) {
    next(err);
  }
});

router.get("/ministries", async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(ministriesTable)
      .orderBy(asc(ministriesTable.name));
    res.json(ListMinistriesResponse.parse(rows));
  } catch (err) {
    next(err);
  }
});

router.get("/departments", async (req, res, next) => {
  try {
    const params = ListDepartmentsQueryParams.parse(req.query);
    const query = db.select().from(departmentsTable);
    const rows =
      params.ministryId !== undefined
        ? await query.where(eq(departmentsTable.ministryId, params.ministryId))
        : await query.orderBy(asc(departmentsTable.name));
    res.json(ListDepartmentsResponse.parse(rows));
  } catch (err) {
    next(err);
  }
});

router.get("/complaint-categories", async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(complaintCategoriesTable)
      .orderBy(asc(complaintCategoriesTable.name));
    res.json(ListComplaintCategoriesResponse.parse(rows));
  } catch (err) {
    next(err);
  }
});

export default router;
