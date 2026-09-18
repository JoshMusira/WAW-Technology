import {
    randomBytes,
    randomUUID,
    scrypt as scryptCallback,
    timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import {
    createAccessToken,
    createRefreshToken,
    getRefreshTokenExpiresAt,
    hashRefreshToken,
    verifyRefreshToken,
} from "../lib/tokens";

const scrypt = promisify(scryptCallback);

type CreateUserBody = {
    email?: unknown;
    name?: unknown;
    password?: unknown;
    role?: unknown;
};

type LoginUserBody = {
    email?: unknown;
    password?: unknown;
};

type RefreshTokenBody = {
    refreshToken?: unknown;
};

type StoredRefreshToken = {
    id: string;
    userId: number;
    expiresAt: Date;
    email: string;
    name: string;
    role: string;
    createdAt: Date;
};

export async function listUsers(_req: Request, res: Response) {
    const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: "asc" },
    });

    return res.status(200).json(users);
}

async function issueTokenPair(user: { id: number; role: string }) {
    const accessToken = await createAccessToken(user);
    const refreshToken = await createRefreshToken(user);

    return { accessToken, refreshToken };
}

export async function createUser(req: Request, res: Response) {
    const { email, name, password, role } = req.body as CreateUserBody;
    // console.log("Received request to create user", { email, name, role });

    if (
        typeof email !== "string" ||
        typeof name !== "string" ||
        typeof password !== "string" ||
        (role !== undefined && role !== "ADMIN" && role !== "STANDARD_USER")
    ) {
        return res.status(400).json({
            error: "email, name, and password are required; role must be ADMIN or STANDARD_USER",
        });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();

    if (
        !normalizedEmail.includes("@") ||
        normalizedName.length === 0 ||
        password.length < 6
    ) {
        return res.status(400).json({
            error: "Provide a valid email, a name, and a password of at least 6 characters",
        });
    }

    try {
        const salt = randomBytes(16).toString("hex");
        const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
        const passwordHash = `${salt}:${derivedKey.toString("hex")}`;

        const user = await prisma.user.create({
            data: {
                email: normalizedEmail,
                name: normalizedName,
                passwordHash,
                ...(role !== undefined ? { role } : {}),
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });

        return res.status(201).json(user);
    } catch (error: unknown) {
        console.error("Failed to register user", {
            email: normalizedEmail,
            error,
        });

        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "P2002"
        ) {
            return res.status(409).json({ error: "A user with that email already exists" });
        }

        return res.status(500).json({ error: "Unable to register user" });
    }
}

export async function loginUser(req: Request, res: Response) {
    const { email, password } = req.body as LoginUserBody;

    if (typeof email !== "string" || typeof password !== "string") {
        return res.status(400).json({
            error: "email and password are required",
        });
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const [salt, storedKeyHex] = user.passwordHash.split(":");
        const storedKey = Buffer.from(storedKeyHex || "", "hex");
        const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

        if (
            storedKey.length !== derivedKey.length ||
            !timingSafeEqual(storedKey, derivedKey)
        ) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const tokens = await issueTokenPair(user);

        await prisma.$executeRaw`
            INSERT INTO "refresh_tokens" ("id", "tokenHash", "userId", "expiresAt")
            VALUES (${randomUUID()}, ${hashRefreshToken(tokens.refreshToken)}, ${user.id}, ${getRefreshTokenExpiresAt()})
        `;

        return res.status(200).json({
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                createdAt: user.createdAt,
            },
        });
    } catch (error: unknown) {
        console.error("Failed to log in user", {
            email: normalizedEmail,
            error,
        });

        return res.status(500).json({ error: "Unable to log in user" });
    }
}

export async function refreshTokens(req: Request, res: Response) {
    const { refreshToken } = req.body as RefreshTokenBody;

    if (typeof refreshToken !== "string" || refreshToken.length === 0) {
        return res.status(400).json({ error: "refreshToken is required" });
    }

    try {
        const payload = await verifyRefreshToken(refreshToken);
        const tokenHash = hashRefreshToken(refreshToken);
        const storedTokens = await prisma.$queryRaw<StoredRefreshToken[]>`
            SELECT
                rt."id",
                rt."userId",
                rt."expiresAt",
                u."email",
                u."name",
                u."role",
                u."createdAt"
            FROM "refresh_tokens" rt
            INNER JOIN "users" u ON u."id" = rt."userId"
            WHERE rt."tokenHash" = ${tokenHash}
              AND rt."userId" = ${payload.id}
              AND rt."revokedAt" IS NULL
              AND rt."expiresAt" > NOW()
            LIMIT 1
        `;
        const storedToken = storedTokens[0];

        if (!storedToken) {
            return res.status(401).json({ error: "Invalid or expired refresh token" });
        }

        const tokens = await issueTokenPair({
            id: storedToken.userId,
            role: storedToken.role,
        });

        await prisma.$transaction(async (transaction) => {
            await transaction.$executeRaw`
                UPDATE "refresh_tokens"
                SET "revokedAt" = NOW()
                WHERE "id" = ${storedToken.id} AND "revokedAt" IS NULL
            `;
            await transaction.$executeRaw`
                INSERT INTO "refresh_tokens" ("id", "tokenHash", "userId", "expiresAt")
                VALUES (${randomUUID()}, ${hashRefreshToken(tokens.refreshToken)}, ${storedToken.userId}, ${getRefreshTokenExpiresAt()})
            `;
        });

        return res.status(200).json(tokens);
    } catch (error: unknown) {
        console.error("Failed to refresh authentication tokens", { error });
        return res.status(401).json({ error: "Invalid or expired refresh token" });
    }
}

export async function logoutUser(req: Request, res: Response) {
    const { refreshToken } = req.body as RefreshTokenBody;

    if (typeof refreshToken !== "string" || refreshToken.length === 0) {
        return res.status(400).json({ error: "refreshToken is required" });
    }

    await prisma.$executeRaw`
        UPDATE "refresh_tokens"
        SET "revokedAt" = NOW()
        WHERE "tokenHash" = ${hashRefreshToken(refreshToken)} AND "revokedAt" IS NULL
    `;

    return res.status(204).send();
}

export async function getCurrentUser(req: Request, res: Response) {
    if (!req.auth) {
        return res.status(401).json({ error: "Authentication required" });
    }

    const user = await prisma.user.findUnique({
        where: { id: req.auth.userId },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json(user);
}
