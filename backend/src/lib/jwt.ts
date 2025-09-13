import jwt from "jsonwebtoken";
import { env } from "../config";
export type JwtPayload = {
  sub: string;
  role: "student" | "counselor" | "admin";
};
export const signAccess = (p: JwtPayload) =>
  jwt.sign(p, env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
export const signRefresh = (p: JwtPayload) =>
  jwt.sign(p, env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
