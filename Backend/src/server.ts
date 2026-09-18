import express from "express";
import cors from "cors";
import morgan from "morgan";
import usersRouter from "./routes/users.routes";
import issuesRouter from "./routes/issues.routes";

const app = express();

app.disable("x-powered-by");
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
}));
app.use(morgan("tiny"));

app.use(express.json());

app.use("/users", usersRouter);
app.use("/issues", issuesRouter);

export default app;