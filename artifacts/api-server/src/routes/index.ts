import { Router, type IRouter } from "express";
import healthRouter from "./health";
import masterdataRouter from "./masterdata";
import statsRouter from "./stats";
import usersRouter from "./users";
import complaintsRouter from "./complaints";
import rtiRouter from "./rti";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(masterdataRouter);
router.use(statsRouter);
router.use(usersRouter);
router.use(complaintsRouter);
router.use(rtiRouter);
router.use(storageRouter);

export default router;
