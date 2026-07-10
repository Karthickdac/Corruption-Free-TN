import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import express from "express";
import { complaintSubmitLimiter, aiLimiter } from "../middlewares/rateLimit";

/**
 * Unit tests for the complaint submission and AI rate limiters.
 *
 * The complaint limiter is bypassed when NODE_ENV=development so repeated
 * automated test runs against the local dev server don't fail with
 * false-negative 429s. The AI limiter is never skipped (AI calls cost money
 * even in dev) but gets a higher dev ceiling of 500/15min instead of the
 * production 20/15min. These tests spin up an isolated express app (no live
 * dev server needed) and prove:
 *   1. In production mode the complaint limiter enforces 5/hour/IP with 429.
 *   2. In development mode the complaint limiter is skipped entirely.
 *   3. In production mode the AI limiter enforces 20/15min/IP with 429.
 *   4. In development mode the AI limiter allows well beyond 20 requests.
 */

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.post("/complaints", complaintSubmitLimiter, (_req, res) => {
    res.status(201).json({ ok: true });
  });
  app.post("/ai", aiLimiter, (_req, res) => {
    res.status(200).json({ ok: true });
  });
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => resolve());
  });
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  vi.unstubAllEnvs();
  await new Promise<void>((resolve, reject) => {
    server.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
});

describe("complaintSubmitLimiter", () => {
  it("returns 429 after 5 requests when NODE_ENV=production", async () => {
    vi.stubEnv("NODE_ENV", "production");

    for (let i = 1; i <= 5; i++) {
      const res = await fetch(`${baseUrl}/complaints`, { method: "POST" });
      expect(res.status, `request ${i} should pass`).toBe(201);
    }

    const blocked = await fetch(`${baseUrl}/complaints`, { method: "POST" });
    expect(blocked.status).toBe(429);
    const body = (await blocked.json()) as { error: string };
    expect(body.error).toMatch(/too many complaints/i);
  });

  it("skips the limiter when NODE_ENV=development", async () => {
    vi.stubEnv("NODE_ENV", "development");

    // The same IP already exhausted its production quota above; in
    // development mode every request must still succeed.
    for (let i = 1; i <= 8; i++) {
      const res = await fetch(`${baseUrl}/complaints`, { method: "POST" });
      expect(res.status, `dev request ${i} should bypass limiter`).toBe(201);
    }
  });
});

describe("aiLimiter", () => {
  it("returns 429 after 20 requests when NODE_ENV=production", async () => {
    vi.stubEnv("NODE_ENV", "production");

    for (let i = 1; i <= 20; i++) {
      const res = await fetch(`${baseUrl}/ai`, { method: "POST" });
      expect(res.status, `request ${i} should pass`).toBe(200);
    }

    const blocked = await fetch(`${baseUrl}/ai`, { method: "POST" });
    expect(blocked.status).toBe(429);
    const body = (await blocked.json()) as { error: string };
    expect(body.error).toMatch(/too many ai requests/i);
  });

  it("allows well beyond 20 requests when NODE_ENV=development", async () => {
    vi.stubEnv("NODE_ENV", "development");

    // The same IP already used up the 20-request production quota above.
    // In development the ceiling is raised to 500, so another 30 requests
    // must all succeed — proving automated test runs won't hit false 429s.
    for (let i = 1; i <= 30; i++) {
      const res = await fetch(`${baseUrl}/ai`, { method: "POST" });
      expect(res.status, `dev request ${i} should be under dev ceiling`).toBe(
        200,
      );
    }
  });

  it("still enforces the higher dev ceiling (limiter is not skipped)", async () => {
    // Sanity check on the middleware wiring: the dev ceiling must come from
    // the limit function, not from skipping the limiter. RateLimit headers
    // are only present when the limiter actually ran.
    vi.stubEnv("NODE_ENV", "development");

    const res = await fetch(`${baseUrl}/ai`, { method: "POST" });
    expect(res.status).toBe(200);
    const limitHeader = res.headers.get("ratelimit-limit");
    expect(limitHeader).toBe("500");
  });
});
