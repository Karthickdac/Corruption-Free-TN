import { Router, type IRouter, type Response } from "express";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable, sessionsTable, type User } from "@workspace/db";
import {
  RegisterBody,
  RegisterResponse,
  LoginBody,
  LoginResponse,
} from "@workspace/api-zod";
import { logAudit } from "../lib/audit";
import { authLimiter } from "../middlewares/rateLimit";
import {
  SESSION_COOKIE,
  SESSION_TTL_MS,
  extractToken,
  purgeExpiredSessions,
} from "../middlewares/authSession";

const router: IRouter = Router();

const INVALID_CREDENTIALS = "Invalid email/phone or password";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  if (!/^[6-9]\d{9}$/.test(digits)) return null;
  return digits;
}

function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
}

async function createSession(userId: number): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  await db.insert(sessionsTable).values({
    token,
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  return token;
}

function toAuthUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };
}

function isUniqueViolation(err: unknown): boolean {
  const code =
    (err as { code?: string })?.code ??
    (err as { cause?: { code?: string } })?.cause?.code;
  return code === "23505";
}

/**
 * POST /auth/register
 * Create an account with email OR mobile number + password.
 */
router.post("/auth/register", authLimiter, async (req, res, next) => {
  try {
    const parsed = RegisterBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      });
      return;
    }
    const { name, password } = parsed.data;

    const email = parsed.data.email ? normalizeEmail(parsed.data.email) : null;
    let phone: string | null = null;
    if (parsed.data.phone) {
      phone = normalizePhone(parsed.data.phone);
      if (!phone) {
        res.status(400).json({
          error: "Enter a valid 10-digit Indian mobile number",
        });
        return;
      }
    }
    if (!email && !phone) {
      res.status(400).json({
        error: "Provide an email address or a mobile number",
      });
      return;
    }

    if (email) {
      const existing = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.email, email));
      if (existing[0]) {
        res.status(409).json({
          error: "An account with this email already exists",
        });
        return;
      }
    }
    if (phone) {
      const existing = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.phone, phone));
      if (existing[0]) {
        res.status(409).json({
          error: "An account with this mobile number already exists",
        });
        return;
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    let user: User;
    try {
      const inserted = await db
        .insert(usersTable)
        .values({
          name: name?.trim() || null,
          email,
          phone,
          passwordHash,
          role: "citizen",
        })
        .returning();
      user = inserted[0]!;
    } catch (err) {
      if (isUniqueViolation(err)) {
        res.status(409).json({
          error: "An account with these details already exists",
        });
        return;
      }
      throw err;
    }

    const token = await createSession(user.id);
    setSessionCookie(res, token);
    await logAudit({
      req,
      userId: user.id,
      action: "register",
      entityType: "user",
      entityId: user.id,
      details: { method: email ? "email" : "phone" },
    });

    res
      .status(201)
      .json(RegisterResponse.parse({ token, user: toAuthUser(user) }));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/login
 * Sign in with email OR mobile number + password.
 */
router.post("/auth/login", authLimiter, async (req, res, next) => {
  try {
    const parsed = LoginBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      });
      return;
    }
    const { identifier, password } = parsed.data;

    let user: User | undefined;
    if (identifier.includes("@")) {
      const email = normalizeEmail(identifier);
      const rows = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));
      user = rows[0];
    } else {
      const phone = normalizePhone(identifier);
      if (phone) {
        const rows = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.phone, phone));
        user = rows[0];
      }
    }

    if (!user?.passwordHash) {
      res.status(401).json({ error: INVALID_CREDENTIALS });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: INVALID_CREDENTIALS });
      return;
    }

    try {
      await purgeExpiredSessions();
    } catch (_err) {
      // non-fatal
    }

    const token = await createSession(user.id);
    setSessionCookie(res, token);
    await logAudit({
      req,
      userId: user.id,
      action: "login",
      entityType: "user",
      entityId: user.id,
      details: { method: identifier.includes("@") ? "email" : "phone" },
    });

    res.json(LoginResponse.parse({ token, user: toAuthUser(user) }));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/logout
 * Invalidate the current session and clear the cookie.
 */
router.post("/auth/logout", async (req, res, next) => {
  try {
    const token = req.sessionToken ?? extractToken(req);
    if (token) {
      await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
    }
    res.clearCookie(SESSION_COOKIE, { path: "/" });
    if (req.localUser) {
      await logAudit({
        req,
        userId: req.localUser.id,
        action: "logout",
        entityType: "user",
        entityId: req.localUser.id,
      });
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
