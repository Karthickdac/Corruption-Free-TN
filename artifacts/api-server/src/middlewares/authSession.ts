import type { Request, Response, NextFunction } from "express";
import { eq, lt } from "drizzle-orm";
import { db, sessionsTable, usersTable } from "@workspace/db";

export const SESSION_COOKIE = "session_token";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

declare global {
  namespace Express {
    interface Request {
      sessionToken?: string;
    }
  }
}

export function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    const token = header.slice("Bearer ".length).trim();
    if (token) return token;
  }
  const cookieToken = (req.cookies as Record<string, string> | undefined)?.[
    SESSION_COOKIE
  ];
  return cookieToken || null;
}

/**
 * Session authentication middleware.
 * Reads a session token from the Authorization Bearer header (mobile) or
 * the httpOnly session cookie (web), validates it against the sessions
 * table, and attaches the user to req.localUser.
 * Never rejects — downstream guards (requireRole etc.) enforce auth.
 */
export async function sessionAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    next();
    return;
  }
  try {
    const rows = await db
      .select({
        sessionId: sessionsTable.id,
        expiresAt: sessionsTable.expiresAt,
        user: usersTable,
      })
      .from(sessionsTable)
      .innerJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
      .where(eq(sessionsTable.token, token));
    const row = rows[0];
    if (!row) {
      next();
      return;
    }
    if (row.expiresAt.getTime() <= Date.now()) {
      await db.delete(sessionsTable).where(eq(sessionsTable.id, row.sessionId));
      next();
      return;
    }
    req.sessionToken = token;
    req.localUser = {
      id: row.user.id,
      role: row.user.role,
      departmentId: row.user.departmentId,
      districtId: row.user.districtId,
      name: row.user.name,
      email: row.user.email,
      phone: row.user.phone,
    };
  } catch (_err) {
    // fail open to unauthenticated; guards will reject where auth is required
  }
  next();
}

/** Remove all expired sessions (called opportunistically on login). */
export async function purgeExpiredSessions(): Promise<void> {
  await db.delete(sessionsTable).where(lt(sessionsTable.expiresAt, new Date()));
}
