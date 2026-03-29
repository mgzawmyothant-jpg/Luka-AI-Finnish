import { Router, type IRouter } from "express";
import healthRouter from "./health";
import lukaRouter from "./luka";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/luka", lukaRouter);

export default router;
