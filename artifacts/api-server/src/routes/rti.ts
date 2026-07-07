import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, rtiRequestsTable, complaintsTable } from "@workspace/db";
import {
  FileRtiBody,
  FileRtiResponse,
  GetRtiParams,
  GetRtiResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toApiRti(r: typeof rtiRequestsTable.$inferSelect) {
  return {
    id: r.id,
    referenceNumber: r.referenceNumber,
    complaintId: r.complaintId,
    complaintNumber: r.complaintNumber,
    applicantName: r.applicantName,
    applicantEmail: r.applicantEmail,
    subject: r.subject,
    description: r.description,
    status: r.status,
    filedAt: r.filedAt.toISOString(),
  };
}

router.post("/rti", async (req, res, next) => {
  try {
    const parsed = FileRtiBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
      return;
    }
    const body = parsed.data;

    let complaintId: number | null = null;
    if (body.complaintNumber) {
      const rows = await db
        .select({ id: complaintsTable.id })
        .from(complaintsTable)
        .where(eq(complaintsTable.complaintNumber, body.complaintNumber));
      complaintId = rows[0]?.id ?? null;
    }

    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    const referenceNumber = `RTI-${year}-${random}`;

    const inserted = await db
      .insert(rtiRequestsTable)
      .values({
        referenceNumber,
        complaintId,
        complaintNumber: body.complaintNumber ?? null,
        applicantName: body.applicantName ?? null,
        applicantEmail: body.applicantEmail ?? null,
        subject: body.subject,
        description: body.description,
      })
      .returning();

    const record = inserted[0];
    if (!record) {
      res.status(400).json({ error: "Failed to file RTI" });
      return;
    }
    res.status(201).json(FileRtiResponse.parse(toApiRti(record)));
  } catch (err) {
    next(err);
  }
});

router.get("/rti/:referenceNumber", async (req, res, next) => {
  try {
    const params = GetRtiParams.parse(req.params);
    const rows = await db
      .select()
      .from(rtiRequestsTable)
      .where(eq(rtiRequestsTable.referenceNumber, params.referenceNumber));
    const record = rows[0];
    if (!record) {
      res.status(404).json({ error: "RTI request not found" });
      return;
    }
    res.json(GetRtiResponse.parse(toApiRti(record)));
  } catch (err) {
    next(err);
  }
});

export default router;
