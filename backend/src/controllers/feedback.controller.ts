import { Response } from "express";
import { AppointmentModel } from "../models/appointment.model";
import { FeedbackModel } from "../models/feedback.model";
import { AuthedRequest } from "../middleware/requireAuth";
import { writeAdminLog } from "./adminLogs.controller"; // ✅ add logging

/* small helpers (same pattern used elsewhere) */
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

export async function createFeedback(req: AuthedRequest, res: Response) {
  try {
    const { appointment_id, rating, comment } = req.body as {
      appointment_id?: string;
      rating?: number;
      comment?: string;
    };

    if (!appointment_id || typeof rating !== "number") {
      await writeAdminLog({
        level: "warn",
        module: "feedback",
        message: "Create: missing appointment_id or rating",
        user_id: String(req.user?.sub ?? ""),
        request_id: reqId(req),
        meta: {
          appointment_id: appointment_id ?? null,
          rating_type: typeof rating,
          ip: ip(req),
          ua: ua(req),
        },
      });
      return res
        .status(400)
        .json({ error: "appointment_id and rating are required" });
    }

    if (rating < 1 || rating > 5) {
      await writeAdminLog({
        level: "warn",
        module: "feedback",
        message: "Create: rating out of bounds",
        user_id: String(req.user?.sub ?? ""),
        request_id: reqId(req),
        meta: { appointment_id, rating, ip: ip(req), ua: ua(req) },
      });
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const appt = await AppointmentModel.findById(appointment_id);
    if (!appt) {
      await writeAdminLog({
        level: "warn",
        module: "feedback",
        message: "Create: appointment not found",
        user_id: String(req.user?.sub ?? ""),
        request_id: reqId(req),
        meta: { appointment_id, ip: ip(req), ua: ua(req) },
      });
      return res.status(404).json({ error: "Appointment not found" });
    }

    if (String(appt.student_id) !== req.user!.sub) {
      await writeAdminLog({
        level: "warn",
        module: "feedback",
        message: "Create: forbidden (not appointment owner)",
        user_id: String(req.user?.sub ?? ""),
        request_id: reqId(req),
        meta: {
          appointment_id,
          owner_student_id: String(appt.student_id),
          actor_id: String(req.user!.sub),
          ip: ip(req),
          ua: ua(req),
        },
      });
      return res.status(403).json({ error: "Forbidden" });
    }

    const existing = await FeedbackModel.findOne({
      appointment_id,
      student_id: req.user!.sub,
    });
    if (existing) {
      await writeAdminLog({
        level: "warn",
        module: "feedback",
        message: "Create: duplicate feedback",
        user_id: String(req.user!.sub),
        request_id: reqId(req),
        meta: {
          appointment_id,
          feedback_id: String(existing._id),
          ip: ip(req),
          ua: ua(req),
        },
      });
      return res.status(400).json({
        error: "You have already submitted feedback for this appointment",
      });
    }

    const fb = await FeedbackModel.create({
      appointment_id,
      student_id: req.user!.sub,
      rating,
      comment,
    });

    await writeAdminLog({
      level: "audit",
      module: "feedback",
      message: "Create: feedback submitted",
      user_id: String(req.user!.sub),
      request_id: reqId(req),
      meta: {
        appointment_id,
        feedback_id: String(fb._id),
        rating,
        comment_len: typeof comment === "string" ? comment.length : 0,
        ip: ip(req),
        ua: ua(req),
      },
    });

    return res.status(201).json(fb);
  } catch (e: any) {
    await writeAdminLog({
      level: "error",
      module: "feedback",
      message: "Create: server error",
      user_id: String(req.user?.sub ?? ""),
      request_id: reqId(req),
      meta: { error: String(e?.message || e), ip: ip(req), ua: ua(req) },
    });
    return res.status(500).json({ error: e.message || "Server error" });
  }
}
