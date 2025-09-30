import { Response } from "express";
import { AuthedRequest } from "../middleware/requireAuth";
import { AppointmentModel } from "../models/appointment.model";
import { VideoSessionModel } from "../models/videoSession.model";
import { writeAdminLog } from "./adminLogs.controller";

/* helpers */
function reqId(req: AuthedRequest) {
  return (
    (req as any).request_id ||
    (req.headers["x-request-id"] as string) ||
    undefined
  );
}
function ua(req: AuthedRequest) {
  return req.get?.("user-agent") || undefined;
}
function ip(req: AuthedRequest) {
  return (
    (req.headers["x-forwarded-for"] as string) || (req as any).ip || undefined
  );
}

export async function getJoinToken(req: AuthedRequest, res: Response) {
  try {
    const appt = await AppointmentModel.findById(
      req.params.appointmentId
    ).lean();
    if (!appt) {
      await writeAdminLog({
        level: "warn",
        module: "video",
        message: "Join token: appointment not found",
        user_id: String(req.user?.sub ?? ""),
        request_id: reqId(req),
        meta: {
          appointment_id: req.params.appointmentId,
          ip: ip(req),
          ua: ua(req),
        },
      });
      return res.status(404).json({ error: "Not found" });
    }

    if (appt.mode !== "video" || appt.status !== "accepted") {
      await writeAdminLog({
        level: "warn",
        module: "video",
        message: "Join token: video not available",
        user_id: String(req.user?.sub ?? ""),
        request_id: reqId(req),
        meta: {
          appointment_id: String(appt._id),
          mode: appt.mode,
          status: appt.status,
          ip: ip(req),
          ua: ua(req),
        },
      });
      return res.status(400).json({ error: "Video not available" });
    }

    const me = String(req.user!.sub);
    const allowed =
      [String(appt.student_id), String(appt.counselor_id)].includes(me) ||
      req.user!.role === "admin";
    if (!allowed) {
      await writeAdminLog({
        level: "warn",
        module: "video",
        message: "Join token: forbidden",
        user_id: String(req.user?.sub ?? ""),
        request_id: reqId(req),
        meta: {
          appointment_id: String(appt._id),
          role: req.user?.role,
          student_id: String(appt.student_id),
          counselor_id: String(appt.counselor_id),
          ip: ip(req),
          ua: ua(req),
        },
      });
      return res.status(403).json({ error: "Forbidden" });
    }

    const vs = await VideoSessionModel.findOne({
      appointment_id: appt._id,
    }).lean();
    if (!vs) {
      await writeAdminLog({
        level: "warn",
        module: "video",
        message: "Join token: session not found",
        user_id: String(req.user?.sub ?? ""),
        request_id: reqId(req),
        meta: { appointment_id: String(appt._id), ip: ip(req), ua: ua(req) },
      });
      return res.status(404).json({ error: "No session" });
    }

    // Use a plain object for RTC config (server-safe)
    const rtcConfig: Record<string, any> = {
      iceServers: [
        { urls: ["stun:stun.l.google.com:19302"] },
        ...(process.env.TURN_URL
          ? [
              {
                urls: [process.env.TURN_URL],
                username: process.env.TURN_USER,
                credential: process.env.TURN_PASS,
              },
            ]
          : []),
      ],
    };

    await writeAdminLog({
      level: "audit",
      module: "video",
      message: "Join token: success",
      user_id: String(req.user!.sub),
      request_id: reqId(req),
      meta: {
        appointment_id: String(appt._id),
        is_student: me === String(appt.student_id),
        is_counselor: me === String(appt.counselor_id),
        has_turn: Boolean(process.env.TURN_URL),
        ip: ip(req),
        ua: ua(req),
      },
    });

    res.json({ token: vs.session_token, rtcConfig });
  } catch (e: any) {
    await writeAdminLog({
      level: "error",
      module: "video",
      message: "Join token: server error",
      user_id: String(req.user?.sub ?? ""),
      request_id: reqId(req),
      meta: {
        appointment_id: req.params.appointmentId,
        error: String(e?.message || e),
        ip: ip(req),
        ua: ua(req),
      },
    });
    res.status(500).json({ error: "Server error" });
  }
}
