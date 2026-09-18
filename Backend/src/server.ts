import express from "express";
import cors from "cors";
import morgan from "morgan";
import usersRouter from "./routes/users.routes";
import issuesRouter from "./routes/issues.routes";
import activityRouter from "./routes/activity.routes";

const app = express();

app.disable("x-powered-by");
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
}));
app.use(morgan("tiny"));

app.use(express.json());

app.get("/health", (_req, res) => {
    return res.status(200).json({ status: "ok" });
});

app.use("/users", usersRouter);
app.use("/issues", issuesRouter);
app.use("/activity", activityRouter);

export default app;