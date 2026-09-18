import type { Request, Response } from "express";
import { Priority, Status } from "../../generated/prisma/enums";
import { createActivityLog } from "../lib/activity";
import { prisma } from "../lib/prisma";

type IssueBody = {
    title?: unknown;
    description?: unknown;
    priority?: unknown;
    status?: unknown;
    assignedToId?: unknown;
};

const issueInclude = {
    createdBy: { select: { id: true, name: true, email: true } },
    assignedTo: { select: { id: true, name: true, email: true } },
    comments: {
        orderBy: { createdAt: "asc" as const },
        include: { author: { select: { id: true, name: true } } },
    },
};

function parseId(value: unknown) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function isPriority(value: unknown): value is Priority {
    return typeof value === "string" && Object.values(Priority).includes(value as Priority);
}

function isStatus(value: unknown): value is Status {
    return typeof value === "string" && Object.values(Status).includes(value as Status);
}

function canManageIssue(req: Request, createdById: number) {
    return req.auth?.role === "ADMIN" || req.auth?.userId === createdById;
}

export async function listIssues(req: Request, res: Response) {
    const { status, priority, assignedToId, search } = req.query;
    const assignedId = assignedToId ? parseId(assignedToId) : null;

    if (assignedToId && !assignedId) {
        return res.status(400).json({ error: "assignedToId must be a valid user id" });
    }

    const issues = await prisma.issue.findMany({
        where: {
            ...(isStatus(status) ? { status } : {}),
            ...(isPriority(priority) ? { priority } : {}),
            ...(assignedId ? { assignedToId: assignedId } : {}),
            ...(typeof search === "string" && search.trim()
                ? { OR: [{ title: { contains: search.trim(), mode: "insensitive" } }, { description: { contains: search.trim(), mode: "insensitive" } }] }
                : {}),
        },
        include: issueInclude,
        orderBy: { updatedAt: "desc" },
    });

    return res.status(200).json(issues);
}

export async function createIssue(req: Request, res: Response) {
    const { title, description, priority, assignedToId } = req.body as IssueBody;
    const assignedId = assignedToId === undefined || assignedToId === null || assignedToId === "" ? null : parseId(assignedToId);

    if (typeof title !== "string" || title.trim().length === 0 || typeof description !== "string" || description.trim().length === 0) {
        return res.status(400).json({ error: "title and description are required" });
    }
    if (priority !== undefined && !isPriority(priority)) {
        return res.status(400).json({ error: "priority must be LOW, MEDIUM, or HIGH" });
    }
    if (assignedToId !== undefined && assignedId === null) {
        return res.status(400).json({ error: "assignedToId must be a valid user id" });
    }

    try {
        const issue = await prisma.issue.create({
            data: {
                title: title.trim(),
                description: description.trim(),
                ...(priority ? { priority } : {}),
                createdById: req.auth!.userId,
                ...(assignedId ? { assignedToId: assignedId } : {}),
            },
            include: issueInclude,
        });
        await createActivityLog({
            actorId: req.auth!.userId,
            action: "CREATED",
            entityType: "ISSUE",
            entityId: issue.id,
            description: `Created issue \"${issue.title}\"`,
        });
        return res.status(201).json(issue);
    } catch (error) {
        console.error("Failed to create issue", error);
        return res.status(400).json({ error: "Unable to create issue or assign the selected user" });
    }
}

export async function updateIssue(req: Request, res: Response) {
    const issueId = parseId(req.params.id);
    const body = req.body as IssueBody;
    if (!issueId) return res.status(400).json({ error: "Invalid issue id" });

    const existing = await prisma.issue.findUnique({ where: { id: issueId } });
    if (!existing) return res.status(404).json({ error: "Issue not found" });
    const statusOnlyUpdate = body.status !== undefined && body.title === undefined && body.description === undefined && body.priority === undefined && body.assignedToId === undefined;
    const canUpdate = canManageIssue(req, existing.createdById) || (statusOnlyUpdate && existing.assignedToId === req.auth?.userId);
    if (!canUpdate) return res.status(403).json({ error: "You cannot edit this issue" });

    const assignedId = body.assignedToId === undefined || body.assignedToId === null || body.assignedToId === "" ? undefined : parseId(body.assignedToId);
    if (body.assignedToId !== undefined && assignedId === null) return res.status(400).json({ error: "assignedToId must be a valid user id" });
    if (body.priority !== undefined && !isPriority(body.priority)) return res.status(400).json({ error: "Invalid priority" });
    if (body.status !== undefined && !isStatus(body.status)) return res.status(400).json({ error: "Invalid status" });

    try {
        const issue = await prisma.issue.update({
            where: { id: issueId },
            data: {
                ...(typeof body.title === "string" && body.title.trim() ? { title: body.title.trim() } : {}),
                ...(typeof body.description === "string" && body.description.trim() ? { description: body.description.trim() } : {}),
                ...(body.priority !== undefined ? { priority: body.priority as Priority } : {}),
                ...(body.status !== undefined ? { status: body.status as Status } : {}),
                ...(body.assignedToId !== undefined ? { assignedToId: assignedId } : {}),
            },
            include: issueInclude,
        });
        const changedFields = [
            body.title !== undefined ? "title" : null,
            body.description !== undefined ? "description" : null,
            body.priority !== undefined ? "priority" : null,
            body.status !== undefined ? "status" : null,
            body.assignedToId !== undefined ? "assignee" : null,
        ].filter((field): field is string => field !== null);
        await createActivityLog({
            actorId: req.auth!.userId,
            action: "UPDATED",
            entityType: "ISSUE",
            entityId: issue.id,
            description: `Updated issue \"${issue.title}\"${changedFields.length ? ` (${changedFields.join(", ")})` : ""}`,
        });
        return res.status(200).json(issue);
    } catch (error) {
        console.error("Failed to update issue", error);
        return res.status(400).json({ error: "Unable to update issue" });
    }
}

export async function addComment(req: Request, res: Response) {
    const issueId = parseId(req.params.id);
    const body = req.body as { body?: unknown };
    if (!issueId || typeof body.body !== "string" || !body.body.trim()) return res.status(400).json({ error: "A comment is required" });

    try {
        const comment = await prisma.comment.create({
            data: { body: body.body.trim(), issueId, authorId: req.auth!.userId },
            include: { author: { select: { id: true, name: true } } },
        });
        await createActivityLog({
            actorId: req.auth!.userId,
            action: "COMMENTED",
            entityType: "ISSUE",
            entityId: issueId,
            description: `Added a comment to issue #${issueId}`,
        });
        return res.status(201).json(comment);
    } catch {
        return res.status(404).json({ error: "Issue not found" });
    }
}
