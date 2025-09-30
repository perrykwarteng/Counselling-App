import { Response } from "express";
import { User } from "../models/user.model";
import { AppointmentModel } from "../models/appointment.model";
import { VideoSessionModel } from "../models/videoSession.model";
import { ChatMessageModel } from "../models/chatMessage.model";
import { sendEmail, sendSMS } from "../notifications";
import { AuthedRequest } from "../middleware/requireAuth";
import { v4 as uuidv4 } from "uuid";
import { writeAdminLog } from "./adminLogs.controller"; // ✅ logging

/* small helpers (same pattern as auth logs) */
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

export async function createAppointment(req: AuthedRequest, res: Response) {
  try {
    if (req.user?.role !== "student") {
      await writeAdminLog({
        level: "warn",
        module: "appointments",
        message: "Create: forbidden (only students can book)",
        user_id: String(req.user?.sub ?? ""),
        request_id: reqId(req),
        meta: { role: req.user?.role, ip: ip(req), ua: ua(req) },
      });
      return res
        .status(403)
        .json({ error: "Only students can book appointments" });
    }

    const {
      counselor_id,
      scheduled_at,
      mode,
      referral_id,
      in_person_location,
      notes,
    } = req.body as {
      counselor_id: string;
      scheduled_at: string;
      mode: "chat" | "video" | "in-person";
      referral_id?: string;
      in_person_location?: string;
      notes?: string;
    };

    if (!counselor_id || !scheduled_at || !mode) {
      await writeAdminLog({
        level: "warn",
        module: "appointments",
        message: "Create: missing required fields",
        user_id: String(req.user?.sub ?? ""),
        request_id: reqId(req),
        meta: { counselor_id, scheduled_at, mode, ip: ip(req), ua: ua(req) },
      });
      return res
        .status(400)
        .json({ error: "counselor_id, scheduled_at, and mode are required" });
    }

    const appt = await AppointmentModel.create({
      student_id: String(req.user.sub),
      counselor_id: String(counselor_id),
      scheduled_at: new Date(scheduled_at),
      mode,
      referral_id,
      in_person_location,
      notes,
    });

    await writeAdminLog({
      level: "audit",
      module: "appointments",
      message: "Create: appointment created",
      user_id: String(req.user.sub),
      request_id: reqId(req),
      meta: {
        appointment_id: String(appt._id),
        counselor_id,
        scheduled_at,
        mode,
        referral_id: referral_id ?? null,
        ip: ip(req),
        ua: ua(req),
      },
    });

    res.status(201).json(appt);
  } catch (e: any) {
    await writeAdminLog({
      level: "error",
      module: "appointments",
      message: "Create: server error",
      user_id: String(req.user?.sub ?? ""),
      request_id: reqId(req),
      meta: { error: String(e?.message || e), ip: ip(req), ua: ua(req) },
    });
    res.status(400).json({ error: e.message });
  }
}

export async function updateAppointment(req: AuthedRequest, res: Response) {
  const appt = await AppointmentModel.findById(req.params.id);
  if (!appt) {
    await writeAdminLog({
      level: "warn",
      module: "appointments",
      message: "Update: appointment not found",
      user_id: String(req.user?.sub ?? ""),
      request_id: reqId(req),
      meta: { id: req.params.id, ip: ip(req), ua: ua(req) },
    });
    return res.status(404).json({ error: "Not found" });
  }

  if (
    String(appt.counselor_id) !== String(req.user!.sub) &&
    req.user!.role !== "admin"
  ) {
    await writeAdminLog({
      level: "warn",
      module: "appointments",
      message: "Update: forbidden (not counselor/admin)",
      user_id: String(req.user?.sub ?? ""),
      request_id: reqId(req),
      meta: {
        id: String(appt._id),
        counselor_id: String(appt.counselor_id),
        actor_role: req.user!.role,
        ip: ip(req),
        ua: ua(req),
      },
    });
    return res.status(403).json({ error: "Forbidden" });
  }

  const prevStatus = appt.status;
  appt.status = (req.body as any).status;
  await appt.save();

  await writeAdminLog({
    level: "audit",
    module: "appointments",
    message: "Update: status changed",
    user_id: String(req.user!.sub),
    request_id: reqId(req),
    meta: {
      appointment_id: String(appt._id),
      from: prevStatus ?? null,
      to: appt.status ?? null,
      mode: appt.mode,
      ip: ip(req),
      ua: ua(req),
    },
  });

  const student = await User.findById(String(appt.student_id)).lean();

  if ((req.body as any).status === "accepted") {
    if (appt.mode === "video") {
      let vs = await VideoSessionModel.findOne({ appointment_id: appt._id });
      let created = false;
      if (!vs) {
        vs = await VideoSessionModel.create({
          appointment_id: appt._id,
          session_token: uuidv4(),
        });
        created = true;
      }
      await writeAdminLog({
        level: "info",
        module: "appointments",
        message: "Update: video session ensured",
        user_id: String(req.user!.sub),
        request_id: reqId(req),
        meta: {
          appointment_id: String(appt._id),
          created,
        },
      });

      const joinUrl = `${process.env.APP_BASE_URL}/video/${appt._id}?t=${vs.session_token}`;
      await sendEmail(
        student?.email,
        "Your Video Session is Confirmed",
        `<p>Your video session is confirmed for ${new Date(
          appt.scheduled_at
        ).toLocaleString()}.</p><p><a href="${joinUrl}">Join video session</a></p>`
      );
      await sendSMS(
        student?.phone,
        `Video session confirmed. Join link: ${joinUrl}`
      );
      await writeAdminLog({
        level: "info",
        module: "appointments",
        message: "Update: video notifications sent",
        user_id: String(req.user!.sub),
        request_id: reqId(req),
        meta: {
          appointment_id: String(appt._id),
          email: student?.email ?? null,
          phone: student?.phone ?? null,
        },
      });
    }

    if (appt.mode === "chat") {
      await ChatMessageModel.create({
        session_id: appt._id,
        sender_id: String(appt.counselor_id),
        content:
          "Hello! Your chat session is now open. How can I support you today?",
        is_system: true,
      });
      await writeAdminLog({
        level: "info",
        module: "appointments",
        message: "Update: chat welcome seeded",
        user_id: String(req.user!.sub),
        request_id: reqId(req),
        meta: { appointment_id: String(appt._id) },
      });

      const link = `${process.env.APP_BASE_URL}/appointments/${appt._id}?tab=chat`;
      await sendEmail(
        student?.email,
        "Your Chat Session is Open",
        `<p>Your counselor accepted your chat session.</p><p><a href="${link}">Start chatting</a></p>`
      );
      await sendSMS(student?.phone, `Chat session accepted. Open: ${link}`);
      await writeAdminLog({
        level: "info",
        module: "appointments",
        message: "Update: chat notifications sent",
        user_id: String(req.user!.sub),
        request_id: reqId(req),
        meta: {
          appointment_id: String(appt._id),
          email: student?.email ?? null,
          phone: student?.phone ?? null,
        },
      });
    }

    if (appt.mode === "in-person") {
      const details = `${new Date(appt.scheduled_at).toLocaleString()} at ${
        appt.in_person_location || "counseling office"
      }`;
      await sendEmail(
        student?.email,
        "In-person Session Confirmed",
        `<p>See you ${details}.</p>`
      );
      await sendSMS(student?.phone, `In-person session confirmed: ${details}`);
      await writeAdminLog({
        level: "info",
        module: "appointments",
        message: "Update: in-person notifications sent",
        user_id: String(req.user!.sub),
        request_id: reqId(req),
        meta: {
          appointment_id: String(appt._id),
          details,
          email: student?.email ?? null,
          phone: student?.phone ?? null,
        },
      });
    }
  }

  res.json(appt);
}

export async function listMyAppointments(req: AuthedRequest, res: Response) {
  const role = req.user!.role;
  const myId = String(req.user!.sub);

  const query =
    role === "student"
      ? { student_id: myId }
      : role === "counselor"
      ? { counselor_id: myId }
      : {};

  const items = await AppointmentModel.find(query)
    .sort({ scheduled_at: -1 })
    .lean();

  await writeAdminLog({
    level: "info",
    module: "appointments",
    message: "List mine",
    user_id: myId,
    request_id: reqId(req),
    meta: { role, count: items.length, ip: ip(req), ua: ua(req) },
  });

  res.json(items);
}

export async function getAppointment(req: AuthedRequest, res: Response) {
  const appt = await AppointmentModel.findById(req.params.id).lean();
  if (!appt) {
    await writeAdminLog({
      level: "warn",
      module: "appointments",
      message: "Get: not found",
      user_id: String(req.user?.sub ?? ""),
      request_id: reqId(req),
      meta: { id: req.params.id, ip: ip(req), ua: ua(req) },
    });
    return res.status(404).json({ error: "Not found" });
  }

  const me = String(req.user!.sub);
  const studentId = String(appt.student_id);
  const counselorId = String(appt.counselor_id);

  if (![studentId, counselorId].includes(me) && req.user!.role !== "admin") {
    await writeAdminLog({
      level: "warn",
      module: "appointments",
      message: "Get: forbidden",
      user_id: me,
      request_id: reqId(req),
      meta: { id: String(appt._id), ip: ip(req), ua: ua(req) },
    });
    return res.status(403).json({ error: "Forbidden" });
  }

  await writeAdminLog({
    level: "info",
    module: "appointments",
    message: "Get: success",
    user_id: me,
    request_id: reqId(req),
    meta: { id: String(appt._id), ip: ip(req), ua: ua(req) },
  });

  res.json(appt);
}
