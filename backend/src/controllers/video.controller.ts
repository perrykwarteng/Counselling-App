import type { Request, Response, RequestHandler } from "express";
import { isValidObjectId } from "mongoose";
import { AppointmentModel } from "../models/appointment.model";
import { VideoSessionModel } from "../models/videoSession.model";
import { writeAdminLog } from "./adminLogs.controller";
import {
  meteredEnsureRoom,
  meteredGenerateAccessToken,
  meteredGetTurnIceServers,
} from "../lib/metered";
import { env } from "../config";

/* ---------------- helpers ---------------- */
const reqId = (req: Request) =>
  ((req as any).request_id as string) ||
  (req.headers["x-request-id"] as string) ||
  undefined;

const ua = (req: Request) => req.get?.("user-agent") || undefined;

const ip = (req: Request) => {
  const xf = (req.headers["x-forwarded-for"] as string) || "";
  const first = xf
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)[0];
  return first || (req as any).ip || undefined;
};

const getDisplayName = (req: Request) => {
  const u = (req as any).user as
    | { name?: string; sub?: string; role?: string }
    | undefined;
  if (u?.name && typeof u.name === "string") return u.name;
  return String(u?.sub || "");
};

function validateMeteredEnv():
  | { ok: true; domain: string; secret: string }
  | { ok: false; error: string } {
  const domain = (env.METERED_DOMAIN || "").trim();
  const secret = (env.METERED_SECRET || env.METERED_API_KEY || "").trim();

  if (!domain) return { ok: false, error: "METERED_DOMAIN is not set" };
  if (!/^[a-z0-9-]+\.metered\.(live|ca)$/i.test(domain)) {
    return {
      ok: false,
      error:
        "METERED_DOMAIN must look like 'your-subdomain.metered.live' (no protocol, no path)",
    };
  }
  if (!secret) return { ok: false, error: "METERED_SECRET is not set" };
  return { ok: true, domain, secret };
}

const safeRoomName = (s: string) => String(s).replace(/[^a-zA-Z0-9_-]/g, "-");

const unpackHttpError = (e: any) => {
  const status =
    e?.response?.status ??
    e?.status ??
    (typeof e?.code === "number" ? e.code : undefined);
  const data = e?.response?.data ?? e?.data ?? e?.message ?? String(e);
  return { status, data };
};

/* ---------------- controller ---------------- */
/**
 * GET /api/video/:appointmentId/join-token
 */
export const getJoinToken: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const user = (req as any).user as
      | { sub: string; role: "student" | "counselor" | "admin"; name?: string }
      | undefined;

    if (!user?.sub) {
      await writeAdminLog({
        level: "warn",
        module: "video",
        message: "Join token: unauthenticated",
        user_id: "",
        request_id: reqId(req),
        meta: { ip: ip(req), ua: ua(req) },
      });
      return res.status(401).json({ error: "Unauthorized" });
    }

    const envCheck = validateMeteredEnv();
    if (!envCheck.ok) {
      await writeAdminLog({
        level: "error",
        module: "video",
        message: "Join token: misconfigured Metered env",
        user_id: user.sub,
        request_id: reqId(req),
        meta: { error: envCheck.error, ip: ip(req), ua: ua(req) },
      });
      return res.status(500).json({ error: envCheck.error });
    }

    const { appointmentId } = req.params;
    if (!isValidObjectId(appointmentId)) {
      await writeAdminLog({
        level: "warn",
        module: "video",
        message: "Join token: invalid id",
        user_id: user.sub,
        request_id: reqId(req),
        meta: { id: appointmentId, ip: ip(req), ua: ua(req) },
      });
      return res.status(400).json({ error: "Invalid appointment id" });
    }

    const appt = await AppointmentModel.findById(appointmentId).lean();
    if (!appt) {
      await writeAdminLog({
        level: "warn",
        module: "video",
        message: "Join token: appointment not found",
        user_id: user.sub,
        request_id: reqId(req),
        meta: { appointment_id: appointmentId, ip: ip(req), ua: ua(req) },
      });
      return res.status(404).json({ error: "Not found" });
    }

    if ((appt as any).mode !== "video" || (appt as any).status !== "accepted") {
      await writeAdminLog({
        level: "warn",
        module: "video",
        message: "Join token: video not available",
        user_id: user.sub,
        request_id: reqId(req),
        meta: {
          appointment_id: String(appt._id),
          mode: (appt as any).mode,
          status: (appt as any).status,
          ip: ip(req),
          ua: ua(req),
        },
      });
      return res.status(400).json({ error: "Video not available" });
    }

    const me = user.sub;
    const allowed =
      [
        String((appt as any).student_id),
        String((appt as any).counselor_id),
      ].includes(me) || user.role === "admin";
    if (!allowed) {
      await writeAdminLog({
        level: "warn",
        module: "video",
        message: "Join token: forbidden",
        user_id: me,
        request_id: reqId(req),
        meta: {
          appointment_id: String(appt._id),
          role: user.role,
          student_id: String((appt as any).student_id),
          counselor_id: String((appt as any).counselor_id),
          ip: ip(req),
          ua: ua(req),
        },
      });
      return res.status(403).json({ error: "Forbidden" });
    }

    // Optional time window (log-only)
    const sched = (appt as any).scheduled_at
      ? new Date((appt as any).scheduled_at)
      : null;
    if (sched) {
      const now = new Date();
      const EARLY_MS = 0;
      const LATE_MS = 3 * 60 * 60 * 1000;
      if (
        now.getTime() < sched.getTime() - EARLY_MS ||
        now.getTime() > sched.getTime() + LATE_MS
      ) {
        await writeAdminLog({
          level: "warn",
          module: "video",
          message: "Join token: out of time window",
          user_id: me,
          request_id: reqId(req),
          meta: { appointment_id: String(appt._id), ip: ip(req), ua: ua(req) },
        });
      }
    }

    // Audit record (not needed by Metered)
    const existing = await VideoSessionModel.findOne({
      appointment_id: (appt as any)._id,
    });
    if (!existing) {
      await VideoSessionModel.create({
        appointment_id: (appt as any)._id,
        session_token_hash: null,
        expires_at: null,
        revoked: false,
      } as any);
    }

    // Room name (stable per appointment)
    const roomName = safeRoomName(`apt-${String((appt as any)._id)}`);

    // 1) Ensure room exists BEFORE token
    try {
      await meteredEnsureRoom(roomName);
    } catch (e: any) {
      const { status, data } = unpackHttpError(e);
      await writeAdminLog({
        level: "error",
        module: "video",
        message: "Join token: meteredEnsureRoom failed",
        user_id: me,
        request_id: reqId(req),
        meta: { status, data, roomName, ip: ip(req), ua: ua(req) },
      });
      return res.status(502).json({
        error: "Upstream error creating room",
        hint: process.env.NODE_ENV === "production" ? undefined : data,
      });
    }

    // 2) Generate access token (v2)
    let accessToken: string;
    try {
      const access = await meteredGenerateAccessToken({
        roomName,
        name: getDisplayName(req),
        externalUserId: me,
        isAdmin: ["admin", "counselor"].includes(user.role),
      });
      accessToken = access.token;
    } catch (e: any) {
      const { status, data } = unpackHttpError(e);
      await writeAdminLog({
        level: "error",
        module: "video",
        message: "Join token: meteredGenerateAccessToken failed",
        user_id: me,
        request_id: reqId(req),
        meta: { status, data, roomName, ip: ip(req), ua: ua(req) },
      });
      return res.status(502).json({
        error: "Upstream error issuing access token",
        hint: process.env.NODE_ENV === "production" ? undefined : data,
      });
    }

    // 3) ICE servers (optional)
    let iceServers: any[] | undefined = undefined;
    try {
      iceServers = await meteredGetTurnIceServers();
    } catch (e: any) {
      const { status, data } = unpackHttpError(e);
      await writeAdminLog({
        level: "warn",
        module: "video",
        message: "Join token: meteredGetTurnIceServers failed (continuing)",
        user_id: me,
        request_id: reqId(req),
        meta: { status, data, ip: ip(req), ua: ua(req) },
      });
    }

    await writeAdminLog({
      level: "audit",
      module: "video",
      message: "Join token: metered issued",
      user_id: me,
      request_id: reqId(req),
      meta: {
        appointment_id: String((appt as any)._id),
        provider: "metered",
        domain: env.METERED_DOMAIN,
        roomName,
        ip: ip(req),
        ua: ua(req),
      },
    });

    return res.json({
      provider: "metered",
      token: accessToken,
      roomName,
      iceServers,
      domain: env.METERED_DOMAIN,
    });
  } catch (e: any) {
    await writeAdminLog({
      level: "error",
      module: "video",
      message: "Join token: server error",
      user_id: String((req as any).user?.sub ?? ""),
      request_id: reqId(req),
      meta: {
        appointment_id: req.params.appointmentId,
        error: String(e?.message || e),
        stack: e?.stack,
        ip: ip(req),
        ua: ua(req),
      },
    });
    return res.status(500).json({ error: "Server error" });
  }
};
