import { Router, type IRouter } from "express";
import { eq, desc, and, count, ilike, type SQL } from "drizzle-orm";
import {
  db,
  usersTable,
  auditLogsTable,
  departmentsTable,
  districtsTable,
  complaintCategoriesTable,
  settingsTable,
} from "@workspace/db";
import {
  ListAdminUsersQueryParams,
  ListAdminUsersResponse,
  UpdateUserRoleBody,
  UpdateUserRoleResponse,
  ListAuditLogsQueryParams,
  ListAuditLogsResponse,
  AdminListDepartmentsResponse,
  AdminCreateDepartmentBody,
  AdminCreateDepartmentResponse,
  AdminUpdateDepartmentParams,
  AdminUpdateDepartmentBody,
  AdminUpdateDepartmentResponse,
  AdminDeleteDepartmentParams,
  AdminListDistrictsResponse,
  AdminCreateDistrictBody,
  AdminCreateDistrictResponse,
  AdminUpdateDistrictParams,
  AdminUpdateDistrictBody,
  AdminUpdateDistrictResponse,
  AdminDeleteDistrictParams,
  AdminListCategoriesResponse,
  AdminCreateCategoryBody,
  AdminCreateCategoryResponse,
  AdminUpdateCategoryParams,
  AdminUpdateCategoryBody,
  AdminUpdateCategoryResponse,
  AdminDeleteCategoryParams,
  AdminListSettingsResponse,
  AdminUpdateSettingParams,
  AdminUpdateSettingBody,
  AdminUpdateSettingResponse,
} from "@workspace/api-zod";
import { requireRole, ADMIN_ROLES } from "../middlewares/rbac";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();

// ─── Users ────────────────────────────────────────────────────────────────────

router.get(
  "/admin/users",
  requireRole([...ADMIN_ROLES, "auditor"]),
  async (req, res, next) => {
    try {
      const params = ListAdminUsersQueryParams.safeParse(req.query);
      const role = params.success ? params.data.role : undefined;
      const limit = params.success ? (params.data.limit ?? 50) : 50;
      const offset = params.success ? (params.data.offset ?? 0) : 0;

      const conditions: SQL[] = [];
      if (role) conditions.push(eq(usersTable.role, role));

      const [usersResult, totalResult] = await Promise.all([
        db
          .select()
          .from(usersTable)
          .where(conditions.length ? and(...conditions) : undefined)
          .orderBy(desc(usersTable.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: count() })
          .from(usersTable)
          .where(conditions.length ? and(...conditions) : undefined),
      ]);

      const total = totalResult[0]?.count ?? 0;
      res.json(
        ListAdminUsersResponse.parse({
          users: usersResult.map((u) => ({
            id: u.id,
            clerkId: u.clerkId,
            name: u.name,
            email: u.email,
            role: u.role,
            departmentId: u.departmentId,
            districtId: u.districtId,
            createdAt: u.createdAt.toISOString(),
          })),
          total,
        }),
      );
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  "/admin/users/:userId/role",
  requireRole(["super_admin"]),
  async (req, res, next) => {
    try {
      const userId = Number(req.params.userId);
      if (isNaN(userId)) {
        res.status(400).json({ error: "Invalid user id" });
        return;
      }
      const parsed = UpdateUserRoleBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
        return;
      }
      const { role, departmentId, districtId } = parsed.data;
      const updated = await db
        .update(usersTable)
        .set({ role, departmentId: departmentId ?? null, districtId: districtId ?? null })
        .where(eq(usersTable.id, userId))
        .returning();
      if (!updated[0]) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const u = updated[0];
      await logAudit({
        req,
        userId: req.localUser?.id ?? null,
        action: "role_update",
        entityType: "user",
        entityId: userId,
        details: { newRole: role, departmentId, districtId },
      });
      res.json(
        UpdateUserRoleResponse.parse({
          id: u.id,
          clerkId: u.clerkId,
          name: u.name,
          email: u.email,
          role: u.role,
          departmentId: u.departmentId,
          districtId: u.districtId,
          createdAt: u.createdAt.toISOString(),
        }),
      );
    } catch (err) {
      next(err);
    }
  },
);

// ─── Audit Logs ───────────────────────────────────────────────────────────────

router.get(
  "/admin/audit-logs",
  requireRole([...ADMIN_ROLES, "auditor"]),
  async (req, res, next) => {
    try {
      const params = ListAuditLogsQueryParams.safeParse(req.query);
      const entityType = params.success ? params.data.entityType : undefined;
      const action = params.success ? params.data.action : undefined;
      const limit = params.success ? (params.data.limit ?? 50) : 50;
      const offset = params.success ? (params.data.offset ?? 0) : 0;

      const conditions: SQL[] = [];
      if (entityType) conditions.push(eq(auditLogsTable.entityType, entityType));
      if (action) conditions.push(eq(auditLogsTable.action, action));

      const [logsResult, totalResult] = await Promise.all([
        db
          .select({ log: auditLogsTable, userName: usersTable.name })
          .from(auditLogsTable)
          .leftJoin(usersTable, eq(auditLogsTable.userId, usersTable.id))
          .where(conditions.length ? and(...conditions) : undefined)
          .orderBy(desc(auditLogsTable.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: count() })
          .from(auditLogsTable)
          .where(conditions.length ? and(...conditions) : undefined),
      ]);

      const total = totalResult[0]?.count ?? 0;
      res.json(
        ListAuditLogsResponse.parse({
          logs: logsResult.map(({ log, userName }) => ({
            id: log.id,
            userId: log.userId,
            userName: userName ?? null,
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId,
            details: log.details as Record<string, unknown> | null,
            ipAddress: log.ipAddress ?? null,
            userAgent: log.userAgent ?? null,
            createdAt: log.createdAt.toISOString(),
          })),
          total,
        }),
      );
    } catch (err) {
      next(err);
    }
  },
);

// ─── Master Data: Departments ─────────────────────────────────────────────────

router.get(
  "/admin/departments",
  requireRole(["super_admin", "state_administrator"]),
  async (req, res, next) => {
    try {
      const rows = await db.select().from(departmentsTable).orderBy(departmentsTable.name);
      res.json(
        AdminListDepartmentsResponse.parse(
          rows.map((d) => ({ id: d.id, name: d.name, nameTa: d.nameTa ?? null, code: "" })),
        ),
      );
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/admin/departments",
  requireRole(["super_admin"]),
  async (req, res, next) => {
    try {
      const body = AdminCreateDepartmentBody.safeParse(req.body);
      if (!body.success) {
        res.status(400).json({ error: body.error.issues[0]?.message ?? "Invalid input" });
        return;
      }
      const inserted = await db.insert(departmentsTable).values({ name: body.data.name }).returning();
      const d = inserted[0]!;
      await logAudit({
        req,
        userId: req.localUser?.id ?? null,
        action: "department_created",
        entityType: "department",
        entityId: d.id,
        details: { name: d.name },
      });
      res.status(201).json(
        AdminCreateDepartmentResponse.parse({ id: d.id, name: d.name, nameTa: d.nameTa ?? null, code: "" }),
      );
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  "/admin/departments/:departmentId",
  requireRole(["super_admin"]),
  async (req, res, next) => {
    try {
      const params = AdminUpdateDepartmentParams.safeParse({ departmentId: Number(req.params.departmentId) });
      if (!params.success) {
        res.status(400).json({ error: "Invalid department id" });
        return;
      }
      const body = AdminUpdateDepartmentBody.safeParse(req.body);
      if (!body.success) {
        res.status(400).json({ error: body.error.issues[0]?.message ?? "Invalid input" });
        return;
      }
      const updated = await db
        .update(departmentsTable)
        .set({ name: body.data.name })
        .where(eq(departmentsTable.id, params.data.departmentId))
        .returning();
      if (!updated[0]) {
        res.status(404).json({ error: "Department not found" });
        return;
      }
      const d = updated[0];
      await logAudit({
        req,
        userId: req.localUser?.id ?? null,
        action: "department_updated",
        entityType: "department",
        entityId: d.id,
        details: { name: d.name },
      });
      res.json(
        AdminUpdateDepartmentResponse.parse({ id: d.id, name: d.name, nameTa: d.nameTa ?? null, code: "" }),
      );
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  "/admin/departments/:departmentId",
  requireRole(["super_admin"]),
  async (req, res, next) => {
    try {
      const params = AdminDeleteDepartmentParams.safeParse({ departmentId: Number(req.params.departmentId) });
      if (!params.success) {
        res.status(400).json({ error: "Invalid department id" });
        return;
      }
      const deleted = await db
        .delete(departmentsTable)
        .where(eq(departmentsTable.id, params.data.departmentId))
        .returning({ id: departmentsTable.id });
      if (!deleted[0]) {
        res.status(404).json({ error: "Department not found" });
        return;
      }
      await logAudit({
        req,
        userId: req.localUser?.id ?? null,
        action: "department_deleted",
        entityType: "department",
        entityId: params.data.departmentId,
        details: {},
      });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

// ─── Master Data: Districts ───────────────────────────────────────────────────

router.get(
  "/admin/districts",
  requireRole(["super_admin", "state_administrator"]),
  async (req, res, next) => {
    try {
      const rows = await db.select().from(districtsTable).orderBy(districtsTable.name);
      res.json(
        AdminListDistrictsResponse.parse(
          rows.map((d) => ({ id: d.id, name: d.name, nameTa: d.nameTa ?? null, code: d.code })),
        ),
      );
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/admin/districts",
  requireRole(["super_admin"]),
  async (req, res, next) => {
    try {
      const body = AdminCreateDistrictBody.safeParse(req.body);
      if (!body.success) {
        res.status(400).json({ error: body.error.issues[0]?.message ?? "Invalid input" });
        return;
      }
      const inserted = await db
        .insert(districtsTable)
        .values({ name: body.data.name, nameTa: body.data.nameTa, code: body.data.code })
        .returning();
      const d = inserted[0]!;
      await logAudit({
        req,
        userId: req.localUser?.id ?? null,
        action: "district_created",
        entityType: "district",
        entityId: d.id,
        details: { name: d.name, code: d.code },
      });
      res.status(201).json(
        AdminCreateDistrictResponse.parse({ id: d.id, name: d.name, nameTa: d.nameTa ?? null, code: d.code }),
      );
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  "/admin/districts/:districtId",
  requireRole(["super_admin"]),
  async (req, res, next) => {
    try {
      const params = AdminUpdateDistrictParams.safeParse({ districtId: Number(req.params.districtId) });
      if (!params.success) {
        res.status(400).json({ error: "Invalid district id" });
        return;
      }
      const body = AdminUpdateDistrictBody.safeParse(req.body);
      if (!body.success) {
        res.status(400).json({ error: body.error.issues[0]?.message ?? "Invalid input" });
        return;
      }
      const updated = await db
        .update(districtsTable)
        .set({ name: body.data.name, nameTa: body.data.nameTa, code: body.data.code })
        .where(eq(districtsTable.id, params.data.districtId))
        .returning();
      if (!updated[0]) {
        res.status(404).json({ error: "District not found" });
        return;
      }
      const d = updated[0];
      await logAudit({
        req,
        userId: req.localUser?.id ?? null,
        action: "district_updated",
        entityType: "district",
        entityId: d.id,
        details: { name: d.name, code: d.code },
      });
      res.json(
        AdminUpdateDistrictResponse.parse({ id: d.id, name: d.name, nameTa: d.nameTa ?? null, code: d.code }),
      );
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  "/admin/districts/:districtId",
  requireRole(["super_admin"]),
  async (req, res, next) => {
    try {
      const params = AdminDeleteDistrictParams.safeParse({ districtId: Number(req.params.districtId) });
      if (!params.success) {
        res.status(400).json({ error: "Invalid district id" });
        return;
      }
      const deleted = await db
        .delete(districtsTable)
        .where(eq(districtsTable.id, params.data.districtId))
        .returning({ id: districtsTable.id });
      if (!deleted[0]) {
        res.status(404).json({ error: "District not found" });
        return;
      }
      await logAudit({
        req,
        userId: req.localUser?.id ?? null,
        action: "district_deleted",
        entityType: "district",
        entityId: params.data.districtId,
        details: {},
      });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

// ─── Master Data: Categories ──────────────────────────────────────────────────

router.get(
  "/admin/categories",
  requireRole(["super_admin", "state_administrator"]),
  async (req, res, next) => {
    try {
      const rows = await db.select().from(complaintCategoriesTable).orderBy(complaintCategoriesTable.name);
      res.json(
        AdminListCategoriesResponse.parse(
          rows.map((c) => ({
            id: c.id,
            name: c.name,
            nameTa: c.nameTa ?? null,
            description: c.description ?? null,
          })),
        ),
      );
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/admin/categories",
  requireRole(["super_admin"]),
  async (req, res, next) => {
    try {
      const body = AdminCreateCategoryBody.safeParse(req.body);
      if (!body.success) {
        res.status(400).json({ error: body.error.issues[0]?.message ?? "Invalid input" });
        return;
      }
      const inserted = await db
        .insert(complaintCategoriesTable)
        .values({
          name: body.data.name,
          nameTa: body.data.nameTa ?? null,
          description: body.data.description ?? null,
        })
        .returning();
      const c = inserted[0]!;
      await logAudit({
        req,
        userId: req.localUser?.id ?? null,
        action: "category_created",
        entityType: "category",
        entityId: c.id,
        details: { name: c.name },
      });
      res.status(201).json(
        AdminCreateCategoryResponse.parse({
          id: c.id,
          name: c.name,
          nameTa: c.nameTa ?? null,
          description: c.description ?? null,
        }),
      );
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  "/admin/categories/:categoryId",
  requireRole(["super_admin"]),
  async (req, res, next) => {
    try {
      const params = AdminUpdateCategoryParams.safeParse({ categoryId: Number(req.params.categoryId) });
      if (!params.success) {
        res.status(400).json({ error: "Invalid category id" });
        return;
      }
      const body = AdminUpdateCategoryBody.safeParse(req.body);
      if (!body.success) {
        res.status(400).json({ error: body.error.issues[0]?.message ?? "Invalid input" });
        return;
      }
      const updated = await db
        .update(complaintCategoriesTable)
        .set({
          name: body.data.name,
          nameTa: body.data.nameTa ?? null,
          description: body.data.description ?? null,
        })
        .where(eq(complaintCategoriesTable.id, params.data.categoryId))
        .returning();
      if (!updated[0]) {
        res.status(404).json({ error: "Category not found" });
        return;
      }
      const c = updated[0];
      await logAudit({
        req,
        userId: req.localUser?.id ?? null,
        action: "category_updated",
        entityType: "category",
        entityId: c.id,
        details: { name: c.name },
      });
      res.json(
        AdminUpdateCategoryResponse.parse({
          id: c.id,
          name: c.name,
          nameTa: c.nameTa ?? null,
          description: c.description ?? null,
        }),
      );
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  "/admin/categories/:categoryId",
  requireRole(["super_admin"]),
  async (req, res, next) => {
    try {
      const params = AdminDeleteCategoryParams.safeParse({ categoryId: Number(req.params.categoryId) });
      if (!params.success) {
        res.status(400).json({ error: "Invalid category id" });
        return;
      }
      const deleted = await db
        .delete(complaintCategoriesTable)
        .where(eq(complaintCategoriesTable.id, params.data.categoryId))
        .returning({ id: complaintCategoriesTable.id });
      if (!deleted[0]) {
        res.status(404).json({ error: "Category not found" });
        return;
      }
      await logAudit({
        req,
        userId: req.localUser?.id ?? null,
        action: "category_deleted",
        entityType: "category",
        entityId: params.data.categoryId,
        details: {},
      });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

// ─── Master Data: Settings ────────────────────────────────────────────────────

router.get(
  "/admin/settings",
  requireRole([...ADMIN_ROLES, "auditor"]),
  async (req, res, next) => {
    try {
      const rows = await db.select().from(settingsTable).orderBy(settingsTable.key);
      res.json(
        AdminListSettingsResponse.parse(
          rows.map((s) => ({
            key: s.key,
            value: s.value ?? null,
            updatedAt: s.updatedAt.toISOString(),
          })),
        ),
      );
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  "/admin/settings/:key",
  requireRole(["super_admin"]),
  async (req, res, next) => {
    try {
      const params = AdminUpdateSettingParams.safeParse({ key: req.params.key });
      if (!params.success) {
        res.status(400).json({ error: "Invalid setting key" });
        return;
      }
      const body = AdminUpdateSettingBody.safeParse(req.body);
      if (!body.success) {
        res.status(400).json({ error: body.error.issues[0]?.message ?? "Invalid input" });
        return;
      }
      const existing = await db
        .select({ key: settingsTable.key })
        .from(settingsTable)
        .where(eq(settingsTable.key, params.data.key));
      if (!existing[0]) {
        res.status(404).json({ error: "Setting not found" });
        return;
      }
      const updated = await db
        .update(settingsTable)
        .set({ value: body.data.value, updatedAt: new Date() })
        .where(eq(settingsTable.key, params.data.key))
        .returning();
      const s = updated[0]!;
      await logAudit({
        req,
        userId: req.localUser?.id ?? null,
        action: "setting_updated",
        entityType: "setting",
        entityId: null,
        details: { key: s.key, value: s.value },
      });
      res.json(
        AdminUpdateSettingResponse.parse({
          key: s.key,
          value: s.value ?? null,
          updatedAt: s.updatedAt.toISOString(),
        }),
      );
    } catch (err) {
      next(err);
    }
  },
);

export default router;
