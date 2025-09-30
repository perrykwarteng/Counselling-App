import { Request, Response, NextFunction } from "express";
import { verifyAccess } from "../lib/jwt"; // <-- use your shared helper

export interface AuthedRequest extends Request {
  user?: { sub: string; role: "student" | "counselor" | "admin" };
}

function getBearerToken(req: Request): string | undefined {
  // Both cases just in case
  const h =
    req.headers.authorization || (req.headers as any).Authorization || "";
  if (typeof h === "string" && h.trim().toLowerCase().startsWith("bearer ")) {
    return h.slice(7).trim();
  }
  return undefined;
}

export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const bearer = getBearerToken(req);
  const cookieToken = (req as any).cookies?.access_token as string | undefined;
  const token = bearer || cookieToken;

  if (!token) {
    return res.status(401).json({ error: "No access token provided" });
  }

  const payload = verifyAccess(token); // <-- SAME logic/secret/options as everywhere else
  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" }); // 401 so client refreshes
  }

  req.user = { sub: String(payload.sub), role: payload.role as any };
  return next();
}

export function requireRole(allowed: Array<"student" | "counselor" | "admin">) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
