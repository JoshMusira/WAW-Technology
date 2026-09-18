import { Router } from "express";
import {
    createUser,
    getCurrentUser,
    loginUser,
    logoutUser,
    listUsers,
    refreshTokens,
    updateUserRole,
} from "../controllers/users.controller";
import { authenticate } from "../middleware/auth.middleware";

const usersRouter = Router();

usersRouter.get("/", authenticate, listUsers);
usersRouter.patch("/:id/role", authenticate, updateUserRole);
usersRouter.post("/", createUser);
usersRouter.post("/login", loginUser);
usersRouter.post("/refresh", refreshTokens);
usersRouter.post("/logout", logoutUser);
usersRouter.get("/me", authenticate, getCurrentUser);

export default usersRouter;
