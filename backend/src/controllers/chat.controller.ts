import { Response } from "express";
import { AppointmentModel } from "../models/appointment.model";
import { ChatMessageModel } from "../models/chatMessage.model";
import { AuthedRequest } from "../middleware/requireAuth";
import { writeAdminLog } from "./adminLogs.controller";

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

export async function listMessages(req: AuthedRequest, res: Response) {
  try {
    const appt = await AppointmentModel.findById(
      req.params.appointmentId
    ).lean();
    if (!appt) {
      await writeAdminLog({
        level: "warn",
        module: "chat",
        message: "List: appointment not found",
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

    if (
      ![String(appt.student_id), String(appt.counselor_id)].includes(
        req.user!.sub
      ) &&
      req.user!.role !== "admin"
    ) {
      await writeAdminLog({
        level: "warn",
        module: "chat",
        message: "List: forbidden",
        user_id: String(req.user?.sub ?? ""),
        request_id: reqId(req),
        meta: {
          appointment_id: String(appt._id),
          owner_student_id: String(appt.student_id),
          counselor_id: String(appt.counselor_id),
          role: req.user!.role,
          ip: ip(req),
          ua: ua(req),
        },
      });
      return res.status(403).json({ error: "Forbidden" });
    }

    const messages = await ChatMessageModel.find({ session_id: appt._id })
      .sort({ created_at: 1 })
      .lean();

    await writeAdminLog({
      level: "audit",
      module: "chat",
      message: "List: messages retrieved",
      user_id: String(req.user!.sub),
      request_id: reqId(req),
      meta: {
        appointment_id: String(appt._id),
        count: messages.length,
        ip: ip(req),
        ua: ua(req),
      },
    });

    res.json(messages);
  } catch (e: any) {
    await writeAdminLog({
      level: "error",
      module: "chat",
      message: "List: server error",
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

export async function sendMessage(req: AuthedRequest, res: Response) {
  try {
    const appt = await AppointmentModel.findById(req.params.appointmentId);
    if (!appt) {
      await writeAdminLog({
        level: "warn",
        module: "chat",
        message: "Send: appointment not found",
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

    if (
      ![String(appt.student_id), String(appt.counselor_id)].includes(
        req.user!.sub
      ) &&
      req.user!.role !== "admin"
    ) {
      await writeAdminLog({
        level: "warn",
        module: "chat",
        message: "Send: forbidden",
        user_id: String(req.user?.sub ?? ""),
        request_id: reqId(req),
        meta: {
          appointment_id: String(appt._id),
          owner_student_id: String(appt.student_id),
          counselor_id: String(appt.counselor_id),
          role: req.user!.role,
          ip: ip(req),
          ua: ua(req),
        },
      });
      return res.status(403).json({ error: "Forbidden" });
    }

    const msg = await ChatMessageModel.create({
      session_id: appt._id,
      sender_id: req.user!.sub,
      content: (req.body as any).content,
    });

    await writeAdminLog({
      level: "audit",
      module: "chat",
      message: "Send: message created",
      user_id: String(req.user!.sub),
      request_id: reqId(req),
      meta: {
        appointment_id: String(appt._id),
        message_id: String(msg._id),
        content_len:
          typeof (req.body as any).content === "string"
            ? (req.body as any).content.length
            : 0,
        is_system: false,
        ip: ip(req),
        ua: ua(req),
      },
    });

    res.status(201).json(msg);
  } catch (e: any) {
    await writeAdminLog({
      level: "error",
      module: "chat",
      message: "Send: server error",
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
