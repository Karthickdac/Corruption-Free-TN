import { Router, type IRouter } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { GetCurrentUserResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/me", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, auth.userId));

    let user = existing[0];
    if (!user) {
      const clerkUser = await clerkClient.users.getUser(auth.userId);
      const name =
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
        null;
      const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
      const inserted = await db
        .insert(usersTable)
        .values({ clerkId: auth.userId, name, email })
        .onConflictDoNothing({ target: usersTable.clerkId })
        .returning();
      user =
        inserted[0] ??
        (
          await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.clerkId, auth.userId))
        )[0];
    }

    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    res.json(
      GetCurrentUserResponse.parse({
        id: user.id,
        clerkId: user.clerkId,
        name: user.name,
        email: user.email,
        role: user.role,
      }),
    );
  } catch (err) {
    next(err);
  }
});

export default router;
