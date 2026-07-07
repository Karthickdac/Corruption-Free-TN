import { Router, type IRouter } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { eq, desc, and, sql, type SQL } from "drizzle-orm";
import { complaintSubmitLimiter } from "../middlewares/rateLimit";
import { logger } from "../lib/logger";
import {
  db,
  complaintsTable,
  districtsTable,
  taluksTable,
  departmentsTable,
  complaintCategoriesTable,
  usersTable,
  auditLogsTable,
  evidenceTable,
  notificationsTable,
  caseNotesTable,
} from "@workspace/db";
import {
  ListComplaintsResponse,
  ListComplaintsQueryParams,
  ListMyComplaintsResponse,
  CreateComplaintBody,
  CreateComplaintResponse,
  TrackComplaintResponse,
  ListEvidenceParams,
  ListEvidenceResponse,
  AddEvidenceParams,
  AddEvidenceBody,
  AddEvidenceResponse,
  UpdateComplaintStatusParams,
  UpdateComplaintStatusBody,
  UpdateComplaintStatusResponse,
  AssignComplaintParams,
  AssignComplaintBody,
  AssignComplaintResponse,
  ListCaseNotesParams,
  ListCaseNotesResponse,
  AddCaseNoteParams,
  AddCaseNoteBody,
  AddCaseNoteResponse,
  SubmitInvestigationReportParams,
  SubmitInvestigationReportBody,
  SubmitInvestigationReportResponse,
  GetComplaintByIdParams,
  GetComplaintByIdResponse,
} from "@workspace/api-zod";
import { ObjectStorageService } from "../lib/objectStorage";
import { ObjectPermission } from "../lib/objectAcl";
import { requireAnyOfficer, requireWriteOfficer, isAllowedTransition, canAccessComplaint } from "../middlewares/rbac";
import { sendEmail } from "../lib/email";
import { logAudit } from "../lib/audit";
import { investigationReportsTable } from "@workspace/db";

const objectStorageService = new ObjectStorageService();

const router: IRouter = Router();

type ComplaintRow = {
  complaint: typeof complaintsTable.$inferSelect;
  districtName: string | null;
  talukName: string | null;
  departmentName: string | null;
  categoryName: string | null;
};

function toApiComplaint(row: ComplaintRow, statusHistory?: { status: string; changedAt: string; note: string | null }[]) {
  const c = row.complaint;
  return {
    id: c.id,
    complaintNumber: c.complaintNumber,
    title: c.title,
    description: c.description,
    status: c.status,
    priority: c.priority,
    isAnonymous: c.isAnonymous,
    districtId: c.districtId,
    districtName: row.districtName,
    talukId: c.talukId,
    talukName: row.talukName,
    departmentId: c.departmentId,
    departmentName: row.departmentName,
    categoryId: c.categoryId,
    categoryName: row.categoryName,
    officeName: c.officeName,
    officerName: c.officerName,
    village: c.village,
    location: c.location,
    amountInvolved:
      c.amountInvolved === null ? null : Number(c.amountInvolved),
    incidentDate: c.incidentDate,
    statusHistory: statusHistory ?? [],
    createdAt: c.createdAt.toISOString(),
  };
}

function complaintSelection() {
  return db
    .select({
      complaint: complaintsTable,
      districtName: districtsTable.name,
      talukName: taluksTable.name,
      departmentName: departmentsTable.name,
      categoryName: complaintCategoriesTable.name,
    })
    .from(complaintsTable)
    .leftJoin(districtsTable, eq(complaintsTable.districtId, districtsTable.id))
    .leftJoin(taluksTable, eq(complaintsTable.talukId, taluksTable.id))
    .leftJoin(
      departmentsTable,
      eq(complaintsTable.departmentId, departmentsTable.id),
    )
    .leftJoin(
      complaintCategoriesTable,
      eq(complaintsTable.categoryId, complaintCategoriesTable.id),
    );
}

async function getStatusHistory(complaintId: number) {
  const logs = await db
    .select()
    .from(auditLogsTable)
    .where(
      and(
        eq(auditLogsTable.entityType, "complaint"),
        eq(auditLogsTable.entityId, complaintId),
        eq(auditLogsTable.action, "status_change"),
      ),
    )
    .orderBy(auditLogsTable.createdAt);
  return logs.map((l) => {
    const d = l.details as { status?: string; note?: string } | null;
    return {
      status: d?.status ?? "submitted",
      changedAt: l.createdAt.toISOString(),
      note: d?.note ?? null,
    };
  });
}

router.get("/complaints", async (req, res, next) => {
  try {
    const params = ListComplaintsQueryParams.parse(req.query);
    const conditions: SQL[] = [];
    if (params.districtId !== undefined) {
      conditions.push(eq(complaintsTable.districtId, params.districtId));
    }
    if (params.departmentId !== undefined) {
      conditions.push(eq(complaintsTable.departmentId, params.departmentId));
    }
    if (params.status !== undefined) {
      conditions.push(eq(complaintsTable.status, params.status));
    }
    const limit = Math.min(Math.max(params.limit ?? 50, 1), 200);

    const base = complaintSelection();
    const filtered =
      conditions.length > 0 ? base.where(and(...conditions)) : base;
    const rows = await filtered
      .orderBy(desc(complaintsTable.createdAt))
      .limit(limit);

    res.json(ListComplaintsResponse.parse(rows.map((r) => toApiComplaint(r))));
  } catch (err) {
    next(err);
  }
});

async function ensureLocalUser(clerkUserId: string): Promise<number | null> {
  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUserId));
  if (existing[0]) return existing[0].id;

  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
  const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;

  const inserted = await db
    .insert(usersTable)
    .values({ clerkId: clerkUserId, name, email })
    .onConflictDoNothing({ target: usersTable.clerkId })
    .returning({ id: usersTable.id });
  if (inserted[0]) return inserted[0].id;

  const refetched = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUserId));
  return refetched[0]?.id ?? null;
}

function isUniqueViolation(err: unknown): boolean {
  const code =
    (err as { code?: string })?.code ??
    (err as { cause?: { code?: string } })?.cause?.code;
  return code === "23505";
}

router.post("/complaints", complaintSubmitLimiter, async (req, res, next) => {
  try {
    const parsed = CreateComplaintBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      });
      return;
    }
    const body = parsed.data;

    if (!body.confirmDuplicate) {
      try {
        const dupConditions: SQL[] = [
          sql`created_at > now() - interval '90 days'`,
          sql`similarity(description, ${body.description}) > 0.55`,
        ];
        if (body.districtId != null) {
          dupConditions.push(sql`district_id = ${body.districtId}`);
        }
        if (body.departmentId != null) {
          dupConditions.push(sql`department_id = ${body.departmentId}`);
        }
        const dupResult = await db.execute(sql`
          SELECT
            complaint_number,
            title,
            status,
            created_at,
            similarity(description, ${body.description}) AS sim
          FROM complaints
          WHERE ${sql.join(dupConditions, sql` AND `)}
          ORDER BY sim DESC
          LIMIT 5
        `);
        const dupRows = dupResult.rows as Array<{
          complaint_number: string;
          title: string;
          status: string;
          created_at: Date;
          sim: number;
        }>;
        if (dupRows.length > 0) {
          res.status(409).json({
            error: "possible_duplicate",
            duplicates: dupRows.map((r) => ({
              complaintNumber: r.complaint_number,
              title: r.title,
              status: r.status,
              submittedAt: new Date(r.created_at).toISOString(),
              similarity: Number(r.sim),
            })),
          });
          return;
        }
      } catch (dupErr) {
        logger.error(
          { err: dupErr },
          "Duplicate check failed; proceeding with complaint submission",
        );
      }
    }

    let userId: number | null = null;
    if (!body.isAnonymous) {
      const auth = getAuth(req);
      if (auth.userId) {
        userId = await ensureLocalUser(auth.userId);
      }
    }

    const year = new Date().getFullYear();
    const maxAttempts = 5;
    let created: typeof complaintsTable.$inferSelect | undefined;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const random = Math.floor(100000 + Math.random() * 900000);
      const complaintNumber = `CFT-${year}-${random}`;
      try {
        const inserted = await db
          .insert(complaintsTable)
          .values({
            complaintNumber,
            title: body.title,
            description: body.description,
            isAnonymous: body.isAnonymous,
            userId,
            districtId: body.districtId ?? null,
            talukId: body.talukId ?? null,
            departmentId: body.departmentId ?? null,
            categoryId: body.categoryId ?? null,
            officeName: body.officeName ?? null,
            officerName: body.officerName ?? null,
            officerDesignation: body.officerDesignation ?? null,
            amountInvolved:
              body.amountInvolved === undefined
                ? null
                : String(body.amountInvolved),
            incidentDate: body.incidentDate ?? null,
            location: body.location ?? null,
            village: (body as any).village ?? null,
            witnesses: body.witnesses ?? null,
          })
          .returning();
        created = inserted[0];
        break;
      } catch (err) {
        if (isUniqueViolation(err) && attempt < maxAttempts - 1) {
          continue;
        }
        throw err;
      }
    }

    if (!created) {
      res.status(400).json({ error: "Failed to create complaint" });
      return;
    }

    await logAudit({
      req,
      userId,
      action: "status_change",
      entityType: "complaint",
      entityId: created.id,
      details: { status: "submitted", note: "Complaint filed" },
    });

    const rows = await complaintSelection().where(
      eq(complaintsTable.id, created.id),
    );
    const row = rows[0];
    if (!row) {
      res.status(400).json({ error: "Failed to create complaint" });
      return;
    }
    const statusHistory = await getStatusHistory(created.id);
    res.status(201).json(CreateComplaintResponse.parse(toApiComplaint(row, statusHistory)));
  } catch (err) {
    next(err);
  }
});

router.get("/complaints/mine", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const localUser = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.clerkId, auth.userId));
    if (!localUser[0]) {
      res.json(ListMyComplaintsResponse.parse([]));
      return;
    }
    const userId = localUser[0].id;
    const rows = await complaintSelection()
      .where(eq(complaintsTable.userId, userId))
      .orderBy(desc(complaintsTable.createdAt));
    res.json(ListMyComplaintsResponse.parse(rows.map((r) => toApiComplaint(r))));
  } catch (err) {
    next(err);
  }
});

router.get("/complaints/:complaintId/evidence", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const params = ListEvidenceParams.parse({ complaintId: Number(req.params.complaintId) });
    const complaint = await db
      .select({
        id: complaintsTable.id,
        userId: complaintsTable.userId,
        departmentId: complaintsTable.departmentId,
        districtId: complaintsTable.districtId,
        assignedOfficerId: complaintsTable.assignedOfficerId,
      })
      .from(complaintsTable)
      .where(eq(complaintsTable.id, params.complaintId));
    if (!complaint[0]) {
      res.status(404).json({ error: "Complaint not found" });
      return;
    }

    const localUser = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.clerkId, auth.userId));
    const localUserId = localUser[0]?.id;

    const isOfficerUser = req.localUser && req.localUser.role !== "citizen";
    if (isOfficerUser) {
      // Officer path: enforce jurisdiction
      if (!canAccessComplaint(req.localUser!, complaint[0])) {
        res.status(403).json({ error: "You do not have jurisdiction over this complaint" });
        return;
      }
    } else {
      // Citizen path: must be the complaint owner
      if (complaint[0].userId === null) {
        res.status(403).json({ error: "Evidence access is not available for anonymous complaints" });
        return;
      }
      if (complaint[0].userId !== localUserId) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
    }
    const rows = await db
      .select()
      .from(evidenceTable)
      .where(eq(evidenceTable.complaintId, params.complaintId));

    // Note: evidence_download is audited in the actual file download path
    // (GET /storage/objects/*), not on metadata listing.

    res.json(
      ListEvidenceResponse.parse(
        rows.map((e) => ({
          id: e.id,
          complaintId: e.complaintId,
          fileUrl: e.fileUrl,
          fileType: e.fileType,
          fileHash: e.fileHash,
          description: e.description,
          uploadedAt: e.uploadedAt.toISOString(),
        })),
      ),
    );
  } catch (err) {
    next(err);
  }
});

router.post("/complaints/:complaintId/evidence", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const params = AddEvidenceParams.parse({ complaintId: Number(req.params.complaintId) });
    const parsed = AddEvidenceBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
      return;
    }

    // Validate fileUrl is a normalized internal object path from our upload flow
    const fileUrl = parsed.data.fileUrl;
    if (!fileUrl.startsWith("/objects/")) {
      res.status(400).json({ error: "Invalid file reference: must be an internal object path from the upload flow" });
      return;
    }

    const complaint = await db
      .select({
        id: complaintsTable.id,
        userId: complaintsTable.userId,
        departmentId: complaintsTable.departmentId,
        districtId: complaintsTable.districtId,
        assignedOfficerId: complaintsTable.assignedOfficerId,
      })
      .from(complaintsTable)
      .where(eq(complaintsTable.id, params.complaintId));
    if (!complaint[0]) {
      res.status(404).json({ error: "Complaint not found" });
      return;
    }

    const localUser = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.clerkId, auth.userId));
    const localUserId = localUser[0]?.id;

    const isOfficerUser = req.localUser && req.localUser.role !== "citizen";
    if (isOfficerUser) {
      // Officer path: enforce jurisdiction
      if (!canAccessComplaint(req.localUser!, complaint[0])) {
        res.status(403).json({ error: "You do not have jurisdiction over this complaint" });
        return;
      }
    } else {
      // Citizen path: must be the complaint owner
      if (complaint[0].userId === null) {
        res.status(403).json({ error: "Evidence upload is not available for anonymous complaints" });
        return;
      }
      if (complaint[0].userId !== localUserId) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
    }

    const inserted = await db
      .insert(evidenceTable)
      .values({
        complaintId: params.complaintId,
        fileUrl,
        fileType: parsed.data.fileType ?? null,
        fileHash: parsed.data.fileHash ?? null,
        description: parsed.data.description ?? null,
      })
      .returning();
    const e = inserted[0]!;

    // Audit: upload event
    await logAudit({
      req,
      userId: localUserId ?? null,
      action: "evidence_upload",
      entityType: "complaint",
      entityId: params.complaintId,
      details: { evidenceId: e.id, fileUrl, fileType: parsed.data.fileType ?? null },
    });

    // Set a private uploader ACL as the fallback policy. Actual evidence
    // access via /storage/objects/* is authorized by complaint context
    // (owner + jurisdiction-authorized officers), which takes precedence.
    try {
      await objectStorageService.trySetObjectEntityAclPolicy(fileUrl, {
        owner: auth.userId,
        visibility: "private",
      });
    } catch (aclErr) {
      req.log.warn({ err: aclErr, fileUrl }, "Failed to set ACL on evidence file — file may be inaccessible");
    }

    res.status(201).json(
      AddEvidenceResponse.parse({
        id: e.id,
        complaintId: e.complaintId,
        fileUrl: e.fileUrl,
        fileType: e.fileType,
        fileHash: e.fileHash,
        description: e.description,
        uploadedAt: e.uploadedAt.toISOString(),
      }),
    );
  } catch (err) {
    next(err);
  }
});

router.get("/complaints/track/:complaintNumber", async (req, res, next) => {
  try {
    const complaintNumber = req.params.complaintNumber;
    const rows = await complaintSelection().where(
      eq(complaintsTable.complaintNumber, complaintNumber),
    );
    const row = rows[0];
    if (!row) {
      res.status(404).json({ error: "Complaint not found" });
      return;
    }
    const [statusHistory, publicNotes] = await Promise.all([
      getStatusHistory(row.complaint.id),
      db
        .select({ id: caseNotesTable.id, content: caseNotesTable.content, createdAt: caseNotesTable.createdAt })
        .from(caseNotesTable)
        .where(
          and(
            eq(caseNotesTable.complaintId, row.complaint.id),
            eq(caseNotesTable.noteType, "department_response"),
            eq(caseNotesTable.isInternal, false),
          ),
        )
        .orderBy(caseNotesTable.createdAt),
    ]);
    res.json(
      TrackComplaintResponse.parse({
        ...toApiComplaint(row, statusHistory),
        departmentResponses: publicNotes.map((n) => ({
          id: n.id,
          content: n.content,
          createdAt: n.createdAt.toISOString(),
        })),
      }),
    );
  } catch (err) {
    next(err);
  }
});

router.get(
  "/complaints/:complaintId",
  requireAnyOfficer(),
  async (req, res, next) => {
    try {
      const params = GetComplaintByIdParams.safeParse({
        complaintId: Number(req.params.complaintId),
      });
      if (!params.success) {
        res.status(400).json({ error: "Invalid complaint id" });
        return;
      }
      const rows = await complaintSelection().where(
        eq(complaintsTable.id, params.data.complaintId),
      );
      if (!rows[0]) {
        res.status(404).json({ error: "Complaint not found" });
        return;
      }
      const row = rows[0];
      const complaint = row.complaint;
      if (req.localUser && !canAccessComplaint(req.localUser, {
        departmentId: complaint.departmentId,
        districtId: complaint.districtId,
        assignedOfficerId: complaint.assignedOfficerId,
      })) {
        res.status(403).json({ error: "You do not have jurisdiction over this complaint" });
        return;
      }
      const statusHistory = await getStatusHistory(params.data.complaintId);
      const reportRows = await db
        .select({
          id: investigationReportsTable.id,
          complaintId: investigationReportsTable.complaintId,
          authorId: investigationReportsTable.authorId,
          authorName: usersTable.name,
          summary: investigationReportsTable.summary,
          findings: investigationReportsTable.findings,
          recommendation: investigationReportsTable.recommendation,
          notes: investigationReportsTable.notes,
          createdAt: investigationReportsTable.createdAt,
        })
        .from(investigationReportsTable)
        .leftJoin(usersTable, eq(investigationReportsTable.authorId, usersTable.id))
        .where(eq(investigationReportsTable.complaintId, params.data.complaintId))
        .limit(1);
      const report = reportRows[0] ?? null;
      res.json(
        GetComplaintByIdResponse.parse({
          ...toApiComplaint(row, statusHistory),
          investigationReport: report
            ? {
                id: report.id,
                complaintId: report.complaintId,
                authorId: report.authorId,
                authorName: report.authorName ?? null,
                summary: report.summary,
                findings: report.findings,
                recommendation: report.recommendation,
                notes: report.notes ?? null,
                createdAt: report.createdAt.toISOString(),
              }
            : null,
        }),
      );
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  "/complaints/:complaintId/status",
  requireWriteOfficer(),
  async (req, res, next) => {
    try {
      const params = UpdateComplaintStatusParams.safeParse({
        complaintId: Number(req.params.complaintId),
      });
      if (!params.success) {
        res.status(400).json({ error: "Invalid complaint id" });
        return;
      }
      const body = UpdateComplaintStatusBody.safeParse(req.body);
      if (!body.success) {
        res.status(400).json({ error: body.error.issues[0]?.message ?? "Invalid input" });
        return;
      }
      const { status: newStatus, note, priority } = body.data;

      const existing = await db
        .select({
          id: complaintsTable.id,
          status: complaintsTable.status,
          userId: complaintsTable.userId,
          departmentId: complaintsTable.departmentId,
          districtId: complaintsTable.districtId,
          assignedOfficerId: complaintsTable.assignedOfficerId,
        })
        .from(complaintsTable)
        .where(eq(complaintsTable.id, params.data.complaintId));
      if (!existing[0]) {
        res.status(404).json({ error: "Complaint not found" });
        return;
      }
      const current = existing[0];

      // Jurisdiction enforcement: officer may only update complaints within their scope
      if (req.localUser && !canAccessComplaint(req.localUser, current)) {
        res.status(403).json({ error: "You do not have jurisdiction over this complaint" });
        return;
      }

      if (!isAllowedTransition(current.status, newStatus)) {
        res.status(400).json({
          error: `Invalid transition: ${current.status} → ${newStatus}`,
        });
        return;
      }

      const updateData: Partial<typeof complaintsTable.$inferInsert> = {
        status: newStatus,
        updatedAt: new Date(),
      };
      if (priority) updateData.priority = priority;

      await db
        .update(complaintsTable)
        .set(updateData)
        .where(eq(complaintsTable.id, params.data.complaintId));

      await logAudit({
        req,
        userId: req.localUser?.id ?? null,
        action: "status_change",
        entityType: "complaint",
        entityId: params.data.complaintId,
        details: { status: newStatus, previousStatus: current.status, note: note ?? null },
      });

      if (current.userId) {
        const statusLabels: Record<string, string> = {
          under_review: "Under Review",
          evidence_verification: "Evidence Verification",
          forwarded: "Forwarded",
          department_response: "Department Response",
          investigation: "Under Investigation",
          action_taken: "Action Taken",
          closed: "Closed",
          rejected: "Rejected",
          reopened: "Reopened",
        };
        const statusLabel = statusLabels[newStatus] ?? newStatus;
        const notifMessage = note ?? `Your complaint has been moved to "${statusLabel}".`;

        // In-app notification
        await db.insert(notificationsTable).values({
          userId: current.userId,
          title: `Complaint status updated: ${statusLabel}`,
          message: notifMessage,
        });

        // Email notification (fires if SMTP is configured; silently logs otherwise)
        const submitter = await db
          .select({ email: usersTable.email })
          .from(usersTable)
          .where(eq(usersTable.id, current.userId));
        if (submitter[0]?.email) {
          await sendEmail({
            to: submitter[0].email,
            subject: `[CorruptionFreeTN] Complaint status updated: ${statusLabel}`,
            text: `Your complaint has been updated to status: ${statusLabel}.\n\n${notifMessage}`,
          });
        }
      }

      const rows = await complaintSelection().where(
        eq(complaintsTable.id, params.data.complaintId),
      );
      const statusHistory = await getStatusHistory(params.data.complaintId);
      res.json(UpdateComplaintStatusResponse.parse(toApiComplaint(rows[0]!, statusHistory)));
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/complaints/:complaintId/assign",
  requireWriteOfficer(),
  async (req, res, next) => {
    try {
      const params = AssignComplaintParams.safeParse({
        complaintId: Number(req.params.complaintId),
      });
      if (!params.success) {
        res.status(400).json({ error: "Invalid complaint id" });
        return;
      }
      const body = AssignComplaintBody.safeParse(req.body);
      if (!body.success) {
        res.status(400).json({ error: body.error.issues[0]?.message ?? "Invalid input" });
        return;
      }

      const complaint = await db
        .select({
          id: complaintsTable.id,
          departmentId: complaintsTable.departmentId,
          districtId: complaintsTable.districtId,
          assignedOfficerId: complaintsTable.assignedOfficerId,
        })
        .from(complaintsTable)
        .where(eq(complaintsTable.id, params.data.complaintId));
      if (!complaint[0]) {
        res.status(404).json({ error: "Complaint not found" });
        return;
      }

      // Jurisdiction enforcement for assign
      if (req.localUser && !canAccessComplaint(req.localUser, complaint[0])) {
        res.status(403).json({ error: "You do not have jurisdiction over this complaint" });
        return;
      }

      const officer = await db
        .select({ id: usersTable.id, name: usersTable.name, role: usersTable.role })
        .from(usersTable)
        .where(eq(usersTable.id, body.data.officerUserId));
      if (!officer[0]) {
        res.status(404).json({ error: "Officer not found" });
        return;
      }
      // Only investigation officers may be assigned to complaints
      if (officer[0].role !== "investigation_officer") {
        res.status(400).json({ error: "Only investigation officers may be assigned to complaints" });
        return;
      }

      await db
        .update(complaintsTable)
        .set({ assignedOfficerId: body.data.officerUserId, updatedAt: new Date() })
        .where(eq(complaintsTable.id, params.data.complaintId));

      await logAudit({
        req,
        userId: req.localUser?.id ?? null,
        action: "assignment",
        entityType: "complaint",
        entityId: params.data.complaintId,
        details: {
          assignedTo: body.data.officerUserId,
          assignedOfficerName: officer[0].name,
          note: body.data.note ?? null,
        },
      });

      await db.insert(notificationsTable).values({
        userId: body.data.officerUserId,
        title: "New complaint assigned to you",
        message: body.data.note ?? "A complaint has been assigned to you for investigation.",
      });

      const rows = await complaintSelection().where(
        eq(complaintsTable.id, params.data.complaintId),
      );
      const statusHistory = await getStatusHistory(params.data.complaintId);
      res.json(AssignComplaintResponse.parse(toApiComplaint(rows[0]!, statusHistory)));
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/complaints/:complaintId/notes",
  requireAnyOfficer(),
  async (req, res, next) => {
    try {
      const params = ListCaseNotesParams.safeParse({
        complaintId: Number(req.params.complaintId),
      });
      if (!params.success) {
        res.status(400).json({ error: "Invalid complaint id" });
        return;
      }
      // Jurisdiction check for reading notes
      const complaintRow = await db
        .select({
          departmentId: complaintsTable.departmentId,
          districtId: complaintsTable.districtId,
          assignedOfficerId: complaintsTable.assignedOfficerId,
        })
        .from(complaintsTable)
        .where(eq(complaintsTable.id, params.data.complaintId));
      if (!complaintRow[0]) {
        res.status(404).json({ error: "Complaint not found" });
        return;
      }
      if (req.localUser && !canAccessComplaint(req.localUser, complaintRow[0])) {
        res.status(403).json({ error: "You do not have jurisdiction over this complaint" });
        return;
      }
      const rows = await db
        .select({
          note: caseNotesTable,
          authorName: usersTable.name,
        })
        .from(caseNotesTable)
        .leftJoin(usersTable, eq(caseNotesTable.authorId, usersTable.id))
        .where(eq(caseNotesTable.complaintId, params.data.complaintId))
        .orderBy(caseNotesTable.createdAt);
      res.json(
        ListCaseNotesResponse.parse(
          rows.map(({ note, authorName }) => ({
            id: note.id,
            complaintId: note.complaintId,
            authorId: note.authorId,
            authorName: authorName ?? null,
            noteType: note.noteType,
            content: note.content,
            isInternal: note.isInternal,
            createdAt: note.createdAt.toISOString(),
          })),
        ),
      );
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/complaints/:complaintId/notes",
  requireWriteOfficer(),
  async (req, res, next) => {
    try {
      const params = AddCaseNoteParams.safeParse({
        complaintId: Number(req.params.complaintId),
      });
      if (!params.success) {
        res.status(400).json({ error: "Invalid complaint id" });
        return;
      }
      const body = AddCaseNoteBody.safeParse(req.body);
      if (!body.success) {
        res.status(400).json({ error: body.error.issues[0]?.message ?? "Invalid input" });
        return;
      }

      const complaint = await db
        .select({
          id: complaintsTable.id,
          userId: complaintsTable.userId,
          departmentId: complaintsTable.departmentId,
          districtId: complaintsTable.districtId,
          assignedOfficerId: complaintsTable.assignedOfficerId,
        })
        .from(complaintsTable)
        .where(eq(complaintsTable.id, params.data.complaintId));
      if (!complaint[0]) {
        res.status(404).json({ error: "Complaint not found" });
        return;
      }
      // Jurisdiction check for adding notes
      if (req.localUser && !canAccessComplaint(req.localUser, complaint[0])) {
        res.status(403).json({ error: "You do not have jurisdiction over this complaint" });
        return;
      }

      const isInternal = body.data.isInternal !== undefined
        ? body.data.isInternal
        : body.data.noteType !== "department_response";

      const inserted = await db
        .insert(caseNotesTable)
        .values({
          complaintId: params.data.complaintId,
          authorId: req.localUser?.id ?? null,
          noteType: body.data.noteType,
          content: body.data.content,
          isInternal,
        })
        .returning();
      const note = inserted[0]!;

      await logAudit({
        req,
        userId: req.localUser?.id ?? null,
        action: "case_note_added",
        entityType: "complaint",
        entityId: params.data.complaintId,
        details: { noteType: note.noteType, isInternal },
      });

      if (body.data.noteType === "department_response" && complaint[0].userId) {
        await db.insert(notificationsTable).values({
          userId: complaint[0].userId,
          title: "Department response added to your complaint",
          message: body.data.content.slice(0, 200),
        });
      }

      res.status(201).json(
        AddCaseNoteResponse.parse({
          id: note.id,
          complaintId: note.complaintId,
          authorId: note.authorId,
          authorName: req.localUser?.name ?? null,
          noteType: note.noteType,
          content: note.content,
          isInternal: note.isInternal,
          createdAt: note.createdAt.toISOString(),
        }),
      );
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/complaints/:complaintId/report",
  requireWriteOfficer(),
  async (req, res, next) => {
    try {
      const params = SubmitInvestigationReportParams.safeParse({
        complaintId: Number(req.params.complaintId),
      });
      if (!params.success) {
        res.status(400).json({ error: "Invalid complaint id" });
        return;
      }
      const body = SubmitInvestigationReportBody.safeParse(req.body);
      if (!body.success) {
        res.status(400).json({ error: body.error.issues[0]?.message ?? "Invalid input" });
        return;
      }

      const complaint = await db
        .select({
          id: complaintsTable.id,
          departmentId: complaintsTable.departmentId,
          districtId: complaintsTable.districtId,
          assignedOfficerId: complaintsTable.assignedOfficerId,
        })
        .from(complaintsTable)
        .where(eq(complaintsTable.id, params.data.complaintId));
      if (!complaint[0]) {
        res.status(404).json({ error: "Complaint not found" });
        return;
      }
      if (req.localUser && !canAccessComplaint(req.localUser, complaint[0])) {
        res.status(403).json({ error: "You do not have jurisdiction over this complaint" });
        return;
      }

      const inserted = await db
        .insert(investigationReportsTable)
        .values({
          complaintId: params.data.complaintId,
          authorId: req.localUser?.id ?? null,
          summary: body.data.summary,
          findings: body.data.findings,
          recommendation: body.data.recommendation,
          notes: body.data.notes ?? null,
        })
        .returning();
      const report = inserted[0]!;

      await logAudit({
        req,
        userId: req.localUser?.id ?? null,
        action: "investigation_report_submitted",
        entityType: "complaint",
        entityId: params.data.complaintId,
        details: { recommendation: body.data.recommendation },
      });

      res.status(201).json(
        SubmitInvestigationReportResponse.parse({
          id: report.id,
          complaintId: report.complaintId,
          authorId: report.authorId,
          authorName: req.localUser?.name ?? null,
          summary: report.summary,
          findings: report.findings,
          recommendation: report.recommendation,
          notes: report.notes,
          createdAt: report.createdAt.toISOString(),
        }),
      );
    } catch (err) {
      next(err);
    }
  },
);

export default router;
