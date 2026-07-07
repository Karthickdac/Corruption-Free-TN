import { Router, type IRouter } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { eq, desc, and, type SQL } from "drizzle-orm";
import {
  db,
  complaintsTable,
  districtsTable,
  taluksTable,
  departmentsTable,
  complaintCategoriesTable,
  usersTable,
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
} from "@workspace/api-zod";
import { evidenceTable } from "@workspace/db";

const router: IRouter = Router();

type ComplaintRow = {
  complaint: typeof complaintsTable.$inferSelect;
  districtName: string | null;
  talukName: string | null;
  departmentName: string | null;
  categoryName: string | null;
};

function toApiComplaint(row: ComplaintRow) {
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
    amountInvolved:
      c.amountInvolved === null ? null : Number(c.amountInvolved),
    incidentDate: c.incidentDate,
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

    res.json(ListComplaintsResponse.parse(rows.map(toApiComplaint)));
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

router.post("/complaints", async (req, res, next) => {
  try {
    const parsed = CreateComplaintBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      });
      return;
    }
    const body = parsed.data;

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

    const rows = await complaintSelection().where(
      eq(complaintsTable.id, created.id),
    );
    const row = rows[0];
    if (!row) {
      res.status(400).json({ error: "Failed to create complaint" });
      return;
    }
    res.status(201).json(CreateComplaintResponse.parse(toApiComplaint(row)));
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
    res.json(ListMyComplaintsResponse.parse(rows.map(toApiComplaint)));
  } catch (err) {
    next(err);
  }
});

router.get("/complaints/:complaintId/evidence", async (req, res, next) => {
  try {
    const params = ListEvidenceParams.parse({ complaintId: Number(req.params.complaintId) });
    const complaint = await db
      .select({ id: complaintsTable.id })
      .from(complaintsTable)
      .where(eq(complaintsTable.id, params.complaintId));
    if (!complaint[0]) {
      res.status(404).json({ error: "Complaint not found" });
      return;
    }
    const rows = await db
      .select()
      .from(evidenceTable)
      .where(eq(evidenceTable.complaintId, params.complaintId));
    res.json(
      ListEvidenceResponse.parse(
        rows.map((e) => ({
          id: e.id,
          complaintId: e.complaintId,
          fileUrl: e.fileUrl,
          fileType: e.fileType,
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
    const params = AddEvidenceParams.parse({ complaintId: Number(req.params.complaintId) });
    const parsed = AddEvidenceBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
      return;
    }
    const complaint = await db
      .select({ id: complaintsTable.id })
      .from(complaintsTable)
      .where(eq(complaintsTable.id, params.complaintId));
    if (!complaint[0]) {
      res.status(404).json({ error: "Complaint not found" });
      return;
    }
    const inserted = await db
      .insert(evidenceTable)
      .values({
        complaintId: params.complaintId,
        fileUrl: parsed.data.fileUrl,
        fileType: parsed.data.fileType ?? null,
        description: parsed.data.description ?? null,
      })
      .returning();
    const e = inserted[0]!;
    res.status(201).json(
      AddEvidenceResponse.parse({
        id: e.id,
        complaintId: e.complaintId,
        fileUrl: e.fileUrl,
        fileType: e.fileType,
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
    res.json(TrackComplaintResponse.parse(toApiComplaint(row)));
  } catch (err) {
    next(err);
  }
});

export default router;
