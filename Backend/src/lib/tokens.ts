import { createHash, randomUUID } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";

const issuer = "issue-tracking-api";
const audience = "issue-tracking-client";
const refreshTokenLifetimeMs = 7 * 24 * 60 * 60 * 1000;

type TokenUser = {
    id: number;
    role: string;
};

function getSecret(name: "ACCESS_TOKEN_SECRET" | "REFRESH_TOKEN_SECRET") {
    const value = process.env[name];

    if (!value || value.length < 32) {
        throw new Error(`${name} must be set and contain at least 32 characters`);
    }

    return new TextEncoder().encode(value);
}

export async function createAccessToken(user: TokenUser) {
    return new SignJWT({ role: user.role, type: "access" })
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setIssuer(issuer)
        .setAudience(audience)
        .setSubject(String(user.id))
        .setIssuedAt()
        .setExpirationTime(process.env.ACCESS_TOKEN_EXPIRES_IN || "15m")
        .sign(getSecret("ACCESS_TOKEN_SECRET"));
}

export async function createRefreshToken(user: TokenUser) {
    return new SignJWT({ type: "refresh" })
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setIssuer(issuer)
        .setAudience(audience)
        .setSubject(String(user.id))
        .setJti(randomUUID())
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(getSecret("REFRESH_TOKEN_SECRET"));
}

export async function verifyAccessToken(token: string) {
    const { payload } = await jwtVerify(token, getSecret("ACCESS_TOKEN_SECRET"), {
        issuer,
        audience,
    });

    if (payload.type !== "access" || typeof payload.sub !== "string") {
        throw new Error("Invalid access token");
    }

    return {
        id: Number(payload.sub),
        role: typeof payload.role === "string" ? payload.role : undefined,
    };
}

export async function verifyRefreshToken(token: string) {
    const { payload } = await jwtVerify(token, getSecret("REFRESH_TOKEN_SECRET"), {
        issuer,
        audience,
    });

    if (payload.type !== "refresh" || typeof payload.sub !== "string") {
        throw new Error("Invalid refresh token");
    }

    return { id: Number(payload.sub) };
}

export function hashRefreshToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
}

export function getRefreshTokenExpiresAt() {
    return new Date(Date.now() + refreshTokenLifetimeMs);
}
