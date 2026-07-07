import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import type { RoleName } from "@workspace/db";

export { type RoleName };

export const WORKFLOW_TRANSITIONS: Record<string, string[]> = {
  submitted: ["under_review", "rejected"],
  under_review: ["evidence_verification", "forwarded", "rejected", "closed"],
  evidence_verification: ["forwarded", "under_review", "rejected"],
  forwarded: ["department_response", "investigation", "rejected"],
  department_response: ["investigation", "action_taken", "closed"],
  investigation: ["action_taken", "closed"],
  action_taken: ["closed"],
  closed: ["reopened"],
  reopened: ["under_review"],
  rejected: ["reopened"],
};

export const OFFICER_ROLES: RoleName[] = [
  "village_officer",
  "taluk_officer",
  "district_officer",
  "department_officer",
  "ministry_officer",
  "state_administrator",
  "super_admin",
  "investigation_officer",
  "moderator",
  "auditor",
  "legal_officer",
];

/**
 * Officer roles that may perform write/mutating operations on complaints.
 * Excludes read-only roles (auditor) that must not trigger complaint mutations.
 */
export const WRITE_OFFICER_ROLES: RoleName[] = OFFICER_ROLES.filter(
  (r) => r !== "auditor",
);

export const ADMIN_ROLES: RoleName[] = [
  "state_administrator",
  "super_admin",
  "moderator",
];

declare global {
  namespace Express {
    interface Request {
      localUser?: {
        id: number;
        role: string;
        departmentId: number | null;
        districtId: number | null;
        clerkId: string;
        name: string | null;
        email: string | null;
      };
    }
  }
}

export async function loadLocalUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = getAuth(req);
  if (!auth.userId) {
    next();
    return;
  }
  try {
    const rows = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, auth.userId));
    if (rows[0]) {
      req.localUser = {
        id: rows[0].id,
        role: rows[0].role,
        departmentId: rows[0].departmentId,
        districtId: rows[0].districtId,
        clerkId: rows[0].clerkId,
        name: rows[0].name,
        email: rows[0].email,
      };
    }
  } catch (_err) {
  }
  next();
}

export function requireRole(roles: string[]) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const auth = getAuth(req);
    if (!auth.userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    if (!req.localUser) {
      try {
        const rows = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.clerkId, auth.userId));
        if (rows[0]) {
          req.localUser = {
            id: rows[0].id,
            role: rows[0].role,
            departmentId: rows[0].departmentId,
            districtId: rows[0].districtId,
            clerkId: rows[0].clerkId,
            name: rows[0].name,
            email: rows[0].email,
          };
        }
      } catch (_err) {
      }
    }
    if (!req.localUser) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    if (!roles.includes(req.localUser.role)) {
      res.status(403).json({
        error: `Insufficient role. Required: ${roles.join(" or ")}. Your role: ${req.localUser.role}`,
      });
      return;
    }
    next();
  };
}

export function requireAnyOfficer() {
  return requireRole(OFFICER_ROLES);
}

/** Guard for mutating complaint endpoints — excludes read-only roles like auditor. */
export function requireWriteOfficer() {
  return requireRole(WRITE_OFFICER_ROLES);
}

export function requireAnyAdmin() {
  return requireRole(ADMIN_ROLES);
}

export function requireSuperAdmin() {
  return requireRole(["super_admin"]);
}

export function isAllowedTransition(from: string, to: string): boolean {
  return WORKFLOW_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Returns true if the current officer may act on a complaint.
 * Super admins, state administrators, moderators, and legal officers bypass all restrictions.
 * Department-scoped roles can only act on complaints in their department.
 * District/taluk/village officers can only act on complaints in their district.
 * Investigation officers can act only on complaints assigned to them.
 * Auditors can read but not modify (enforcement at the route level).
 */
export function canAccessComplaint(
  user: NonNullable<Express.Request["localUser"]>,
  complaint: { departmentId: number | null; districtId: number | null; assignedOfficerId: number | null },
): boolean {
  const bypassRoles = ["super_admin", "state_administrator", "moderator", "legal_officer", "auditor"];
  if (bypassRoles.includes(user.role)) return true;

  if (user.role === "department_officer" || user.role === "ministry_officer") {
    if (!user.departmentId) return false;
    // Require explicit match — complaints with null departmentId are not accessible
    return complaint.departmentId !== null && complaint.departmentId === user.departmentId;
  }

  if (
    user.role === "district_officer" ||
    user.role === "taluk_officer" ||
    user.role === "village_officer"
  ) {
    if (!user.districtId) return false;
    // Require explicit match — complaints with null districtId are not accessible
    return complaint.districtId !== null && complaint.districtId === user.districtId;
  }

  if (user.role === "investigation_officer") {
    return complaint.assignedOfficerId === user.id;
  }

  return false;
}
