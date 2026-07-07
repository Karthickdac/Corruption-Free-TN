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

export function requireAnyAdmin() {
  return requireRole(ADMIN_ROLES);
}

export function requireSuperAdmin() {
  return requireRole(["super_admin"]);
}

export function isAllowedTransition(from: string, to: string): boolean {
  return WORKFLOW_TRANSITIONS[from]?.includes(to) ?? false;
}
