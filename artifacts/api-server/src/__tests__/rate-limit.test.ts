import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import express from "express";
import { complaintSubmitLimiter } from "../middlewares/rateLimit";

/**
 * Unit tests for the complaint submission rate limiter.
 *
 * The limiter is bypassed when NODE_ENV=development so repeated automated
 * test runs against the local dev server don't fail with false-negative
 * 429s. These tests spin up an isolated express app (no live dev server
 * needed) and prove:
 *   1. In production mode the limiter still enforces 5/hour/IP with 429.
 *   2. In development mode the limiter is skipped entirely.
 */

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.post("/complaints", complaintSubmitLimiter, (_req, res) => {
    res.status(201).json({ ok: true });
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
