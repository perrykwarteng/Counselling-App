// src/middleware/requireAuth.ts
import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { Role } from "../models/user.model";
import { verifyAccess } from "../lib/jwt";

/** What we expect back from verifyAccess */
type JwtPayload = {
  sub: string | number;
  role: Role;
  name?: string;
  email?: string;
};

export type AuthedUser = {
  sub: string;
  role: Role;
  name?: string;
  email?: string;
};

export interface AuthedRequest extends Request {
  user?: AuthedUser;
}

function getBearerToken(req: Request): string | undefined {
  const h =
    req.headers.authorization || (req.headers as any).Authorization || "";
  if (typeof h === "string" && h.trim().toLowerCase().startsWith("bearer ")) {
    return h.slice(7).trim();
  }
  return undefined;
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const bearer = getBearerToken(req);
  const cookieToken = (req as any).cookies?.access_token as string | undefined;
  const token = bearer || cookieToken;

  if (!token)
    return res.status(401).json({ error: "No access token provided" });

  const payload = verifyAccess(token) as Partial<JwtPayload> | null | undefined;
  if (!payload || !payload.sub || !payload.role) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // Narrow and attach a properly-typed user object
  (req as AuthedRequest).user = {
    sub: String(payload.sub),
    role: payload.role as Role,
    name: payload.name,
    email: payload.email,
  };

  next();
};

export const requireRole =
  (allowed: Array<"student" | "counselor" | "admin">): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    const user = (req as Partial<AuthedRequest>).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (!allowed.includes(user.role))
      return res.status(403).json({ error: "Forbidden" });
    next();
  };
