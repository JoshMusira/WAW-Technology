import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { addComment, createIssue, listIssues, updateIssue } from "../controllers/issues.controller";

const issuesRouter = Router();

issuesRouter.use(authenticate);
issuesRouter.get("/", listIssues);
issuesRouter.post("/", createIssue);
issuesRouter.patch("/:id", updateIssue);
issuesRouter.post("/:id/comments", addComment);

export default issuesRouter;
