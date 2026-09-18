import { prisma } from "./prisma";

type ActivityInput = {
    actorId: number;
    action: string;
    entityType: string;
    entityId?: number;
    description: string;
};

export async function createActivityLog(input: ActivityInput) {
    try {
        await prisma.activityLog.create({ data: input });
    } catch (error) {
        console.error("Failed to create activity log", { input, error });
    }
}