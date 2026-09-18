import { Router } from "express";
import { listActivityLogs } from "../controllers/activity.controller";
import { authenticate } from "../middleware/auth.middleware";

const activityRouter = Router();

activityRouter.use(authenticate);
activityRouter.get("/", listActivityLogs);

export default activityRouter;