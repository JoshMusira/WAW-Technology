import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/tokens";

declare global {
    namespace Express {
        interface Request {
            auth?: {
                userId: number;
                role?: string;
            };
        }
    }
}

export async function authenticate(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const authorization = req.header("authorization");
    const [scheme, token] = authorization?.split(" ") || [];

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ error: "Bearer access token required" });
    }

    try {
        const payload = await verifyAccessToken(token);
        req.auth = { userId: payload.id, role: payload.role };
        return next();
    } catch {
        return res.status(401).json({ error: "Invalid or expired access token" });
    }
}
