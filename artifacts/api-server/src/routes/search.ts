import { Router, type IRouter } from "express";
import { createRequire } from "module";
import { sql, eq, and, gte, lte, ilike, desc, asc, count, or } from "drizzle-orm";
import {
  db,
  complaintsTable,
  districtsTable,
  taluksTable,
  departmentsTable,
  complaintCategoriesTable,
  usersTable,
} from "@workspace/db";
import { SearchComplaintsResponse } from "@workspace/api-zod";

const _require = createRequire(import.meta.url);

const router: IRouter = Router();

router.get("/search/complaints", async (req, res, next) => {
  try {
    const {
      q,
      complaintNumber,
      status,
      departmentId,
      districtId,
      talukId,
      categoryId,
      priority,
      officerName: officerNameFilter,
      from,
      to,
      minAmount,
      maxAmount,
      page: pageStr,
      limit: limitStr,
      sortBy = "createdAt",
      sortDir = "desc",
      format,
    } = req.query as Record<string, string | undefined>;

    const page = Math.max(1, Number(pageStr) || 1);
    const limit = Math.min(Number(limitStr) || 20, 100);
    const offset = (page - 1) * limit;

    const conditions = [];
    if (q) {
      conditions.push(
        or(
          ilike(complaintsTable.title, `%${q}%`),
          ilike(complaintsTable.description, `%${q}%`),
          ilike(complaintsTable.officerName, `%${q}%`),
          ilike(complaintsTable.location, `%${q}%`),
        )!
      );
    }
    if (complaintNumber) conditions.push(ilike(complaintsTable.complaintNumber, `%${complaintNumber}%`));
    if (status) conditions.push(eq(complaintsTable.status, status));
    if (departmentId) conditions.push(eq(complaintsTable.departmentId, Number(departmentId)));
    if (districtId) conditions.push(eq(complaintsTable.districtId, Number(districtId)));
    if (talukId) conditions.push(eq(complaintsTable.talukId, Number(talukId)));
    if (categoryId) conditions.push(eq(complaintsTable.categoryId, Number(categoryId)));
    if (priority) conditions.push(eq(complaintsTable.priority, priority));
    if (officerNameFilter) conditions.push(ilike(usersTable.name, `%${officerNameFilter}%`));
    if (from) conditions.push(gte(complaintsTable.createdAt, new Date(from)));
    if (to) {
      const d = new Date(to);
      d.setHours(23, 59, 59, 999);
      conditions.push(lte(complaintsTable.createdAt, d));
    }
    if (minAmount) conditions.push(gte(complaintsTable.amountInvolved, String(minAmount)));
    if (maxAmount) conditions.push(lte(complaintsTable.amountInvolved, String(maxAmount)));

    const where = conditions.length ? and(...conditions) : undefined;

    const sortCol = sortBy === "status" ? complaintsTable.status
      : sortBy === "priority" ? complaintsTable.priority
      : sortBy === "updatedAt" ? complaintsTable.updatedAt
      : complaintsTable.createdAt;
    const order = sortDir === "asc" ? asc(sortCol) : desc(sortCol);

    const [rows, totalRows] = await Promise.all([
      db
        .select({
          complaint: complaintsTable,
          districtName: districtsTable.name,
          talukName: taluksTable.name,
          departmentName: departmentsTable.name,
          categoryName: complaintCategoriesTable.name,
          officerName: usersTable.name,
        })
        .from(complaintsTable)
        .leftJoin(districtsTable, eq(complaintsTable.districtId, districtsTable.id))
        .leftJoin(taluksTable, eq(complaintsTable.talukId, taluksTable.id))
        .leftJoin(departmentsTable, eq(complaintsTable.departmentId, departmentsTable.id))
        .leftJoin(complaintCategoriesTable, eq(complaintsTable.categoryId, complaintCategoriesTable.id))
        .leftJoin(usersTable, eq(complaintsTable.assignedOfficerId, usersTable.id))
        .where(where)
        .orderBy(order)
        .limit(limit)
        .offset(offset),
      (officerNameFilter
        ? db.select({ count: count() }).from(complaintsTable)
            .leftJoin(usersTable, eq(complaintsTable.assignedOfficerId, usersTable.id))
            .where(where)
        : db.select({ count: count() }).from(complaintsTable).where(where)
      ),
    ]);

    const complaints = rows.map(r => ({
      id: r.complaint.id,
      complaintNumber: r.complaint.complaintNumber,
      title: r.complaint.title,
      description: r.complaint.description,
      status: r.complaint.status,
      priority: r.complaint.priority,
      isAnonymous: r.complaint.isAnonymous,
      districtId: r.complaint.districtId,
      districtName: r.districtName ?? null,
      talukId: r.complaint.talukId,
      talukName: r.talukName ?? null,
      departmentId: r.complaint.departmentId,
      departmentName: r.departmentName ?? null,
      categoryId: r.complaint.categoryId,
      categoryName: r.categoryName ?? null,
      officeName: r.complaint.officeName,
      officerName: r.complaint.officerName,
      village: r.complaint.village,
      location: r.complaint.location,
      amountInvolved: r.complaint.amountInvolved ? Number(r.complaint.amountInvolved) : null,
      incidentDate: r.complaint.incidentDate,
      assignedOfficerId: r.complaint.assignedOfficerId,
      assignedOfficerName: r.officerName ?? null,
      createdAt: r.complaint.createdAt.toISOString(),
    }));

    if (format === "csv" || format === "xlsx") {
      const headers = ["ID", "Number", "Title", "Status", "Priority", "District", "Taluk", "Department", "Category", "Officer", "Village", "Amount", "Date"];
      const rows = complaints.map(c => [
        c.id,
        c.complaintNumber,
        c.title,
        c.status,
        c.priority,
        c.districtName ?? "",
        c.talukName ?? "",
        c.departmentName ?? "",
        c.categoryName ?? "",
        c.officerName ?? "",
        c.village ?? "",
        c.amountInvolved ?? "",
        c.createdAt.split("T")[0],
      ]);

      if (format === "xlsx") {
        // @ts-ignore — xlsx package
        const XLSX = await import("xlsx");
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        XLSX.utils.book_append_sheet(wb, ws, "Complaints");
        const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="complaints-export.xlsx"`);
        res.send(buf);
        return;
      }

      const csvRows = [headers.join(","), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))];
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="complaints-export.csv"`);
      res.send(csvRows.join("\n"));
      return;
    }

    if (format === "pdf") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const PDFDocument: any = _require("pdfkit");
      const doc = new PDFDocument({ margin: 36, size: "A4", layout: "landscape" });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      await new Promise<void>((resolve) => {
        doc.on("end", resolve);
        const pageW = 841.89;
        doc.fontSize(16).font("Helvetica-Bold").text("Corruption Complaint Report — Tamil Nadu", { align: "center" });
        doc.moveDown(0.3);
        doc.fontSize(9).font("Helvetica").fillColor("#555")
          .text(`Generated: ${new Date().toLocaleDateString("en-IN")}  |  Total records: ${complaints.length}`, { align: "center" });
        doc.moveDown(0.8);
        const colWidths = [24, 88, 160, 68, 56, 76, 110, 72, 80];
        const headers = ["#", "Ref No.", "Title", "Status", "Priority", "District", "Department", "Officer", "Date"];
        let cx = 36;
        doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#000");
        headers.forEach((h, i) => { doc.text(h, cx, doc.y, { width: colWidths[i], lineBreak: false }); cx += colWidths[i]; });
        doc.moveDown(0.25);
        const lineY = doc.y;
        doc.moveTo(36, lineY).lineTo(pageW - 36, lineY).strokeColor("#666").stroke();
        doc.moveDown(0.2);
        doc.fontSize(7).font("Helvetica").fillColor("#111");
        complaints.slice(0, 200).forEach((c, idx) => {
          if (doc.y > 530) { doc.addPage(); }
          const rowY = doc.y;
          cx = 36;
          const cells = [
            String(idx + 1), c.complaintNumber ?? "", c.title.slice(0, 32),
            c.status, c.priority,
            (c.districtName ?? "").slice(0, 14),
            (c.departmentName ?? "").slice(0, 18),
            (c.assignedOfficerName ?? c.officerName ?? "").slice(0, 14),
            (c.createdAt ?? "").slice(0, 10),
          ];
          cells.forEach((cell, i) => { doc.text(cell, cx, rowY, { width: colWidths[i] - 2, lineBreak: false, ellipsis: true }); cx += colWidths[i]; });
          doc.y = rowY + 13;
        });
        doc.end();
      });
      const pdf = Buffer.concat(chunks);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="complaints-report.pdf"`);
      res.send(pdf);
      return;
    }

    const total = totalRows[0]?.count ?? 0;
    res.json(SearchComplaintsResponse.parse({ results: complaints, total, page, limit }));
  } catch (err) {
    next(err);
  }
});

export default router;
