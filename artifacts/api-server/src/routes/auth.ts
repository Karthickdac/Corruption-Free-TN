import { Router, type IRouter } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();

/**
 * POST /auth/session
 * Called by the frontend after a successful Clerk sign-in.
 * Ensures the user exists in our DB and logs the login event with IP + UA.
 */
router.post("/auth/session", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    let rows = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.clerkId, auth.userId));

    if (!rows[0]) {
      const clerkUser = await clerkClient.users.getUser(auth.userId);
      const name =
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
        null;
      const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
      const inserted = await db
        .insert(usersTable)
        .values({ clerkId: auth.userId, name, email })
        .onConflictDoNothing({ target: usersTable.clerkId })
        .returning({ id: usersTable.id });
      if (inserted[0]) {
        rows = inserted;
      } else {
        rows = await db
          .select({ id: usersTable.id })
          .from(usersTable)
          .where(eq(usersTable.clerkId, auth.userId));
      }
    }

    const userId = rows[0]?.id ?? null;
    await logAudit({
      req,
      userId,
      action: "login",
      entityType: "user",
      entityId: userId,
      details: { clerkId: auth.userId },
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
