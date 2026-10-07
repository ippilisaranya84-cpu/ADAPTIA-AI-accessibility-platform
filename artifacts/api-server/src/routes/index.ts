import { Router, type IRouter } from "express";
import healthRouter from "./health";
import languagesRouter from "./languages";
import adaptationsRouter from "./adaptations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(languagesRouter);
router.use(adaptationsRouter);

export default router;
