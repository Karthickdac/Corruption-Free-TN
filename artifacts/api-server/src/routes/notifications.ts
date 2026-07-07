import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, notificationsTable, usersTable } from "@workspace/db";
import {
  ListNotificationsResponse,
  MarkNotificationReadResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/notifications", async (req, res, next) => {
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
      res.json(ListNotificationsResponse.parse([]));
      return;
    }
    const rows = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, localUser[0].id))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);
    res.json(
      ListNotificationsResponse.parse(
        rows.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          isRead: n.isRead,
          createdAt: n.createdAt.toISOString(),
        })),
      ),
    );
  } catch (err) {
    next(err);
  }
});

router.patch("/notifications/:notificationId/read", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const notificationId = Number(req.params.notificationId);
    if (isNaN(notificationId)) {
      res.status(400).json({ error: "Invalid notification id" });
      return;
    }
    const localUser = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.clerkId, auth.userId));
    if (!localUser[0]) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    // Ownership-scoped update: WHERE id = $1 AND userId = $2
    // This prevents IDOR — a user cannot mark another user's notification as read
    const updated = await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(
        and(
          eq(notificationsTable.id, notificationId),
          eq(notificationsTable.userId, localUser[0].id),
        ),
      )
      .returning();
    if (!updated[0]) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }
    const n = updated[0];
    res.json(
      MarkNotificationReadResponse.parse({
        id: n.id,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      }),
    );
  } catch (err) {
    next(err);
  }
});

export default router;
