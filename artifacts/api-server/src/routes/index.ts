import { Router, type IRouter } from "express";
import healthRouter from "./health";
import masterdataRouter from "./masterdata";
import statsRouter from "./stats";
import usersRouter from "./users";
import complaintsRouter from "./complaints";
import storageRouter from "./storage";
import adminRouter from "./admin";
import dashboardRouter from "./dashboard";
import notificationsRouter from "./notifications";
import authRouter from "./auth";
import analyticsRouter from "./analytics";
import searchRouter from "./search";
import aiRouter from "./ai";
import { sessionAuth } from "../middlewares/authSession";

const router: IRouter = Router();

router.use(sessionAuth);
router.use(healthRouter);
router.use(masterdataRouter);
router.use(statsRouter);
router.use(usersRouter);
router.use(complaintsRouter);
router.use(storageRouter);
router.use(adminRouter);
router.use(dashboardRouter);
router.use(notificationsRouter);
router.use(authRouter);
router.use(analyticsRouter);
router.use(searchRouter);
router.use(aiRouter);

export default router;
