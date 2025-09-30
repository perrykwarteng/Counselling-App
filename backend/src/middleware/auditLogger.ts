import { Request, Response, NextFunction } from "express";
import { v4 as uuid } from "uuid";
import { writeAdminLog } from "../controllers/adminLogs.controller";

export function auditLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const requestId = (req.headers["x-request-id"] as string) || uuid();
  (req as any).request_id = requestId;

  res.setHeader("x-request-id", requestId);

  const user = (req as any).user;
  const userId = user?.id ?? null;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;

    // use "audit" for completed requests, "error" for 5xx if you want
    const level = status >= 500 ? "error" : "audit";

    writeAdminLog({
      level,
      module: "http",
      message: `${req.method} ${req.originalUrl} -> ${status} (${duration}ms)`,
      user_id: userId,
      request_id: requestId,
      meta: {
        method: req.method,
        url: req.originalUrl,
        status,
        duration_ms: duration,
        ip: req.ip,
        ua: req.headers["user-agent"],
      },
    });
  });

  next();
}
