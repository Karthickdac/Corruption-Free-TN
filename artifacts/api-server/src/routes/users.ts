import { Router, type IRouter } from "express";
import { GetCurrentUserResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/auth/me", (req, res, next) => {
  try {
    const user = req.localUser;
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    res.json(
      GetCurrentUserResponse.parse({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      }),
    );
  } catch (err) {
    next(err);
  }
});

export default router;
