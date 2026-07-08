import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * LIVE-SERVER INTEGRATION CHECK — not a hermetic unit test.
 *
 * This suite runs against the live dev API server (default port 8080) and the
 * shared dev database. It is intentionally an end-to-end integration check of
 * evidence file-reference validation against real object storage; the
 * corresponding user-facing behavior (422 → failure toast) is covered
 * hermetically in tn-portal's submit-evidence-retry.test.tsx.
 *
 * If the API server is not reachable, the whole suite SKIPS (it does not
 * fail), so this file is safe to include in standard test runs while still
 * being classified as an environment-dependent integration check.
 *
 * Covers the regression where an evidence record referencing an object that
 * never finished uploading (or never existed) could be saved, leaving
 * officers with broken evidence links.
 *
 * NOTE: Complaint submission is rate-limited to 5/hour/IP (and registration
 * to 20/15min). Running this suite more than ~5 times within an hour will
 * fail with 429 in beforeAll — that is the rate limiter, not a regression.
 */

const API = process.env.API_BASE_URL ?? "http://localhost:8080/api";

// Probe the server once at collection time: any HTTP response (even an error
// status) means the server is up; only a connection failure means it is not.
const serverUp = await (async () => {
  try {
    await fetch(`${API}/departments`, { signal: AbortSignal.timeout(3000) });
    return true;
  } catch {
    return false;
  }
})();

if (!serverUp) {
  console.warn(
    `[evidence-validation] API server unreachable at ${API} — skipping live-server integration suite.`,
  );
}

interface RegisterResponse {
  token: string;
}
interface ComplaintResponse {
  id: number;
}
interface UploadUrlResponse {
  uploadURL: string;
  objectPath: string;
}
interface ErrorResponse {
  error: string;
}
interface EvidenceResponse {
  id: number;
  complaintId: number;
  fileUrl: string;
}

let token: string;
let complaintId: number;

const authHeaders = () => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

beforeAll(async () => {
  if (!serverUp) return;
  const email = `evidence-test-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}@example.com`;
  const reg = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password: "Passw0rd!23",
      fullName: "Evidence Validation Test",
    }),
  });
  expect(reg.ok, `register failed: ${reg.status}`).toBe(true);
  token = ((await reg.json()) as RegisterResponse).token;
  expect(token).toBeTruthy();

  const complaint = await fetch(`${API}/complaints`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      title: `Evidence validation test ${Date.now()}`,
      description:
        "Automated integration test complaint for evidence file-reference validation.",
      isAnonymous: false,
      // Identical descriptions across runs trigger the 409 duplicate check;
      // confirmDuplicate keeps the suite idempotent.
      confirmDuplicate: true,
    }),
  });
  expect(complaint.ok, `create complaint failed: ${complaint.status}`).toBe(
    true,
  );
  complaintId = ((await complaint.json()) as ComplaintResponse).id;
  expect(complaintId).toBeGreaterThan(0);
}, 30000);

/**
 * Teardown: remove every user/complaint this suite has ever created (matched
 * by the reserved `evidence-test-*@example.com` email pattern) so automated
 * test data never pollutes public transparency lists, district stats, or the
 * heat map in the shared dev database. Also cleans up leftovers from runs
 * that predate this teardown.
 */
afterAll(async () => {
  if (!serverUp) return;
  const { pool } = await import("@workspace/db");
  try {
    const users = await pool.query<{ id: number }>(
      `SELECT id FROM users WHERE email LIKE 'evidence-test-%@example.com'`,
    );
    const userIds = users.rows.map((r) => r.id);
    if (userIds.length === 0) return;

    const complaints = await pool.query<{ id: number }>(
      `SELECT id FROM complaints WHERE user_id = ANY($1)`,
      [userIds],
    );
    const complaintIds = complaints.rows.map((r) => r.id);

    if (complaintIds.length > 0) {
      await pool.query(`DELETE FROM evidence WHERE complaint_id = ANY($1)`, [
        complaintIds,
      ]);
      await pool.query(`DELETE FROM case_notes WHERE complaint_id = ANY($1)`, [
        complaintIds,
      ]);
      await pool.query(
        `DELETE FROM investigation_reports WHERE complaint_id = ANY($1)`,
        [complaintIds],
      );
      await pool.query(
        `DELETE FROM rti_requests WHERE complaint_id = ANY($1)`,
        [complaintIds],
      );
      await pool.query(`DELETE FROM complaints WHERE id = ANY($1)`, [
        complaintIds,
      ]);
    }

    await pool.query(`DELETE FROM notifications WHERE user_id = ANY($1)`, [
      userIds,
    ]);
    await pool.query(`DELETE FROM audit_logs WHERE user_id = ANY($1)`, [
      userIds,
    ]);
    await pool.query(`DELETE FROM sessions WHERE user_id = ANY($1)`, [
      userIds,
    ]);
    await pool.query(`DELETE FROM users WHERE id = ANY($1)`, [userIds]);
  } finally {
    await pool.end();
  }
}, 30000);

describe.skipIf(!serverUp)("POST /complaints/:complaintId/evidence file-reference validation", () => {
  it("rejects unauthenticated requests with 401", async () => {
    const res = await fetch(`${API}/complaints/${complaintId}/evidence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileUrl: "/objects/uploads/whatever",
        fileType: "image/jpeg",
      }),
    });
    expect(res.status).toBe(401);
  });

  it("rejects a fileUrl outside the internal /objects/ namespace with 400", async () => {
    const res = await fetch(`${API}/complaints/${complaintId}/evidence`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        fileUrl: "https://evil.example.com/file.jpg",
        fileType: "image/jpeg",
      }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as ErrorResponse;
    expect(body.error).toMatch(/internal object path/i);
  });

  it("rejects a nonexistent object path with 422 and a clear message", async () => {
    const fakePath = `/objects/uploads/nonexistent-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;
    const res = await fetch(`${API}/complaints/${complaintId}/evidence`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ fileUrl: fakePath, fileType: "image/jpeg" }),
    });
    expect(res.status).toBe(422);
    const body = (await res.json()) as ErrorResponse;
    expect(body.error).toMatch(/not found in storage/i);
    expect(body.error).toMatch(/re-upload/i);
  });

  it("does not persist an evidence row for the rejected nonexistent path", async () => {
    const list = await fetch(`${API}/complaints/${complaintId}/evidence`, {
      headers: authHeaders(),
    });
    expect(list.ok).toBe(true);
    const rows = (await list.json()) as EvidenceResponse[];
    expect(
      rows.filter((r) => r.fileUrl.includes("nonexistent-")),
    ).toHaveLength(0);
  });

  it("accepts evidence referencing a real uploaded object (201 control case)", async () => {
    const up = await fetch(`${API}/storage/uploads/request-url`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        name: "control.jpg",
        size: 12,
        contentType: "image/jpeg",
      }),
    });
    expect(up.ok, `request-url failed: ${up.status}`).toBe(true);
    const { uploadURL, objectPath } = (await up.json()) as UploadUrlResponse;
    expect(objectPath.startsWith("/objects/")).toBe(true);

    const put = await fetch(uploadURL, {
      method: "PUT",
      headers: { "Content-Type": "image/jpeg" },
      body: new TextEncoder().encode("fakejpgbytes"),
    });
    expect(put.ok, `PUT upload failed: ${put.status}`).toBe(true);

    const res = await fetch(`${API}/complaints/${complaintId}/evidence`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        fileUrl: objectPath,
        fileType: "image/jpeg",
        description: "control.jpg",
      }),
    });
    expect(res.status).toBe(201);
    const created = (await res.json()) as EvidenceResponse;
    expect(created.fileUrl).toBe(objectPath);
    expect(created.complaintId).toBe(complaintId);

    const list = await fetch(`${API}/complaints/${complaintId}/evidence`, {
      headers: authHeaders(),
    });
    const rows = (await list.json()) as EvidenceResponse[];
    expect(rows.some((r) => r.id === created.id)).toBe(true);
  }, 30000);
});
