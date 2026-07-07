import { Router, type IRouter } from "express";
import { eq, desc, and, count, ilike, type SQL } from "drizzle-orm";
import { db, usersTable, auditLogsTable, departmentsTable } from "@workspace/db";
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
} from "@workspace/api-zod";
import { requireRole, OFFICER_ROLES, ADMIN_ROLES } from "../middlewares/rbac";

const router: IRouter = Router();

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

      const query = db.select().from(usersTable);
      if (conditions.length) query.where(and(...conditions));

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
        .set({
          role,
          departmentId: departmentId ?? null,
          districtId: districtId ?? null,
        })
        .where(eq(usersTable.id, userId))
        .returning();
      if (!updated[0]) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const u = updated[0];

      await db.insert(auditLogsTable).values({
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
          .select({
            log: auditLogsTable,
            userName: usersTable.name,
          })
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

// Super-admin master data: departments

router.get(
  "/admin/departments",
  requireRole(["super_admin", "state_administrator"]),
  async (req, res, next) => {
    try {
      const rows = await db
        .select()
        .from(departmentsTable)
        .orderBy(departmentsTable.name);
      res.json(
        AdminListDepartmentsResponse.parse(
          rows.map((d) => ({
            id: d.id,
            name: d.name,
            nameTa: d.nameTa ?? null,
            code: "",
          })),
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
      const inserted = await db
        .insert(departmentsTable)
        .values({ name: body.data.name })
        .returning();
      const d = inserted[0]!;
      await db.insert(auditLogsTable).values({
        userId: req.localUser?.id ?? null,
        action: "department_created",
        entityType: "department",
        entityId: d.id,
        details: { name: d.name },
      });
      res.status(201).json(
        AdminCreateDepartmentResponse.parse({
          id: d.id,
          name: d.name,
          nameTa: d.nameTa ?? null,
          code: "",
        }),
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
      await db.insert(auditLogsTable).values({
        userId: req.localUser?.id ?? null,
        action: "department_updated",
        entityType: "department",
        entityId: d.id,
        details: { name: d.name },
      });
      res.json(
        AdminUpdateDepartmentResponse.parse({
          id: d.id,
          name: d.name,
          nameTa: d.nameTa ?? null,
          code: "",
        }),
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
      await db.insert(auditLogsTable).values({
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

export default router;
