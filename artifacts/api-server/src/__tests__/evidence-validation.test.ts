import { describe, it, expect, beforeAll } from "vitest";

/**
 * Integration tests for evidence file-reference validation.
 *
 * Requires the API server dev workflow to be running (default port 8080).
 * Covers the regression where an evidence record referencing an object that
 * never finished uploading (or never existed) could be saved, leaving
 * officers with broken evidence links.
 *
 * NOTE: Complaint submission is rate-limited to 5/hour/IP (and registration
 * to 20/15min). Running this suite more than ~5 times within an hour will
 * fail with 429 in beforeAll — that is the rate limiter, not a regression.
 */

const API = process.env.API_BASE_URL ?? "http://localhost:8080/api";

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

describe("POST /complaints/:complaintId/evidence file-reference validation", () => {
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
