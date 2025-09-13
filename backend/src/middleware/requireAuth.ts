import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config";

export interface AuthedRequest extends Request {
  user?: { sub: string; role: "student" | "counselor" | "admin" };
}

export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const h = req.headers.authorization;
  const bearer = h && h.startsWith("Bearer ") ? h.slice(7) : undefined;
  const cookieToken = (req as any).cookies?.access_token as string | undefined;
  const token = bearer || cookieToken;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const p = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;
    req.user = { sub: p.sub, role: p.role };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
