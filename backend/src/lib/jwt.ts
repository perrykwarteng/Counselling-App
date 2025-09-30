// src/lib/jwt.ts
import jwt from "jsonwebtoken";

export type JwtPayload = {
  sub: string;
  role: "admin" | "student" | "counselor";
  iat?: number;
  exp?: number;
};

function requireSecret(
  name: "ACCESS_TOKEN_SECRET" | "REFRESH_TOKEN_SECRET"
): string {
  const val = process.env[name];
  if (!val || !val.trim()) {
    throw new Error(
      `${name} is missing. Set it in your server environment (e.g., backend/.env) BEFORE starting the server.`
    );
  }
  return val;
}

export function signAccess(payload: Pick<JwtPayload, "sub" | "role">) {
  return jwt.sign(payload, requireSecret("ACCESS_TOKEN_SECRET"), {
    expiresIn: "30m",
  });
}

export function signRefresh(payload: Pick<JwtPayload, "sub" | "role">) {
  return jwt.sign(payload, requireSecret("REFRESH_TOKEN_SECRET"), {
    expiresIn: "7d",
  });
}

export function verifyAccess(token: string): JwtPayload | null {
  try {
    return jwt.verify(
      token,
      requireSecret("ACCESS_TOKEN_SECRET")
    ) as JwtPayload;
  } catch {
    return null;
  }
}

export function verifyRefresh(token: string): JwtPayload | null {
  try {
    return jwt.verify(
      token,
      requireSecret("REFRESH_TOKEN_SECRET")
    ) as JwtPayload;
  } catch {
    return null;
  }
}
