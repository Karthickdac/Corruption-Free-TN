import type { Request } from "express";
import { db, auditLogsTable } from "@workspace/db";

export interface AuditLogParams {
  req: Request;
  userId: number | null;
  action: string;
  entityType?: string | null;
  entityId?: number | null;
  details?: Record<string, unknown> | null;
}

function extractIp(req: Request): string | null {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return first?.split(",")[0]?.trim() ?? null;
  }
  return req.socket?.remoteAddress ?? null;
}

export async function logAudit(params: AuditLogParams): Promise<void> {
  const {
    req,
    userId,
    action,
    entityType = null,
    entityId = null,
    details = null,
  } = params;
  const ipAddress = extractIp(req);
  const userAgent = (req.headers["user-agent"] as string | undefined) ?? null;
  await db.insert(auditLogsTable).values({
    userId,
    action,
    entityType,
    entityId,
    details,
    ipAddress,
    userAgent,
  });
}
