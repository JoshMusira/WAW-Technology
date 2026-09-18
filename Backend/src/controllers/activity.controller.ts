import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function listActivityLogs(_req: Request, res: Response) {
    const logs = await prisma.activityLog.findMany({
        take: 100,
        include: { actor: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(logs);
}