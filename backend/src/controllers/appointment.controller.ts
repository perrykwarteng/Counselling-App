import { Response } from "express";
import { isValidObjectId } from "mongoose";
import { User } from "../models/user.model";
import { AppointmentModel } from "../models/appointment.model";
import { VideoSessionModel } from "../models/videoSession.model";
import { ChatMessageModel } from "../models/chatMessage.model";
import { sendEmail } from "../lib/mailer";
import { AuthedRequest } from "../middleware/requireAuth";
import { writeAdminLog } from "./adminLogs.controller";
import {
  sendChatSessionEmail,
  sendInPersonSessionEmail,
  sendVideoSessionEmail,
} from "../lib/emails";
import { env } from "../config";

function reqId(req: AuthedRequest): string | undefined {
  return (
    (req as any).request_id ||
    (req.headers["x-request-id"] as string | undefined)
  );
}
function ua(req: AuthedRequest): string | undefined {
  return req.get?.("user-agent") || undefined;
}
function ip(req: AuthedRequest): string | undefined {
  const xf = (req.headers["x-forwarded-for"] as string) || "";
  const first = xf
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)[0];
  return first || ((req as any).ip as string | undefined);
}
const authSub = (req: AuthedRequest) => String(req.user?.sub ?? "");

function buildJoinUrl(apptId: string) {
  const base = env.APP_FRONTEND_URL || "http://localhost:3000/";
  return `${base.replace(/\/+$/, "")}/appointment/video/${String(apptId)}`;
}

type MinimalUser = { _id?: string; email?: string };
const STATUS = new Set([
  "pending",
  "accepted",
  "rejected",
  "cancelled",
  "completed",
]);

async function findUserByAnyId(id: string): Promise<MinimalUser | null> {
  if (!id) return null;
  return await User.findOne({
    $or: [
      { _id: id },
      { id },
      { auth_id: id },
      { auth_sub: id },
      { external_id: id },
      { user_id: id },
    ],
  })
    .select({ email: 1, _id: 1 })
    .lean<MinimalUser>();
}

function humanStatus(s: string) {
  switch (s) {
    case "pending":
      return "Pending";
    case "accepted":
      return "Accepted";
    case "rejected":
      return "Rejected";
    case "cancelled":
      return "Cancelled";
    case "completed":
      return "Completed";
    default:
      return s;
  }
}

export async function createAppointment(req: AuthedRequest, res: Response) {
  try {
    const role = req.user?.role;
    const me = authSub(req);

    if (role !== "student") {
      await writeAdminLog({
        level: "warn",
        module: "appointments",
        message: "Create: forbidden (only students can book)",
        user_id: me,
        request_id: reqId(req),
        meta: { role, ip: ip(req), ua: ua(req) },
      });
      return res
        .status(403)
        .json({ error: "Only students can book appointments" });
    }

    const body = req.body as {
      counselor_id?: string;
      scheduled_at?: string;
      mode?: "chat" | "video" | "in-person";
      referral_id?: string;
      in_person_location?: string;
      notes?: string;
    };

    const counselor_id = String(body.counselor_id ?? "");
    const scheduled_at = String(body.scheduled_at ?? "");
    const mode = body.mode;

    if (!counselor_id || !scheduled_at || !mode) {
      await writeAdminLog({
        level: "warn",
        module: "appointments",
        message: "Create: missing required fields",
        user_id: me,
        request_id: reqId(req),
        meta: { counselor_id, scheduled_at, mode, ip: ip(req), ua: ua(req) },
      });
      return res
        .status(400)
        .json({ error: "counselor_id, scheduled_at, and mode are required" });
    }

    const appt = await AppointmentModel.create({
      student_id: me,
      counselor_id,
      scheduled_at: new Date(scheduled_at),
      mode,
      referral_id: body.referral_id,
      in_person_location: body.in_person_location,
      notes: body.notes,
      status: "pending",
    } as any);

    await writeAdminLog({
      level: "audit",
      module: "appointments",
      message: "Create: appointment created",
      user_id: me,
      request_id: reqId(req),
      meta: {
        appointment_id: String(appt._id),
        counselor_id,
        scheduled_at,
        mode,
        referral_id: body.referral_id ?? null,
        ip: ip(req),
        ua: ua(req),
      },
    });

    // Notify counselor when student books
    const counselor = await findUserByAnyId(counselor_id);
    const when = new Date(appt.scheduled_at).toLocaleString();
    if (counselor?.email) {
      await sendEmail(
        counselor.email,
        "New appointment request",
        `You have a new ${appt.mode} appointment request from a student on ${when}. Status: Pending.`,
        `<p>Hi Counselor,</p>
         <p>You have a new <b>${appt.mode}</b> appointment request from a student.</p>
         <p><b>When:</b> ${when}</p>
         <p><b>Status:</b> Pending</p>
         <p>Please review and accept or decline in your dashboard.</p>`
      );
    }

    return res.status(201).json(appt);
  } catch (e: any) {
    await writeAdminLog({
      level: "error",
      module: "appointments",
      message: "Create: server error",
      user_id: authSub(req),
      request_id: reqId(req),
      meta: { error: String(e?.message || e), ip: ip(req), ua: ua(req) },
    });
    return res.status(400).json({ error: String(e?.message || e) });
  }
}

export async function updateAppointment(req: AuthedRequest, res: Response) {
  const id = String(req.params?.id ?? "");
  if (!isValidObjectId(id)) {
    await writeAdminLog({
      level: "warn",
      module: "appointments",
      message: "Update: invalid id",
      user_id: authSub(req),
      request_id: reqId(req),
      meta: { id, ip: ip(req), ua: ua(req) },
    });
    return res.status(400).json({ error: "Invalid appointment id" });
  }

  const appt = await AppointmentModel.findById(id);
  if (!appt) {
    await writeAdminLog({
      level: "warn",
      module: "appointments",
      message: "Update: appointment not found",
      user_id: authSub(req),
      request_id: reqId(req),
      meta: { id, ip: ip(req), ua: ua(req) },
    });
    return res.status(404).json({ error: "Not found" });
  }

  const me = authSub(req);
  const isCounselor = String((appt as any).counselor_id) === me;
  const isAdmin = req.user?.role === "admin";
  const isStudent = String((appt as any).student_id) === me;

  const next = String((req.body as { status?: string }).status || "");
  if (!STATUS.has(next)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const prevStatus = (appt as any).status as string | undefined;
  const canTransition =
    isCounselor ||
    isAdmin ||
    (isStudent &&
      ["pending", "accepted"].includes(prevStatus || "pending") &&
      next === "cancelled");

  if (!canTransition) {
    await writeAdminLog({
      level: "warn",
      module: "appointments",
      message: "Update: forbidden transition",
      user_id: me,
      request_id: reqId(req),
      meta: {
        id: String(appt._id),
        from: prevStatus ?? null,
        to: next,
        actor_role: req.user?.role,
        ip: ip(req),
        ua: ua(req),
      },
    });
    return res.status(403).json({ error: "Forbidden" });
  }

  (appt as any).status = next as any;
  await appt.save();

  await writeAdminLog({
    level: "audit",
    module: "appointments",
    message: "Update: status changed",
    user_id: me,
    request_id: reqId(req),
    meta: {
      appointment_id: String(appt._id),
      from: prevStatus ?? null,
      to: (appt as any).status ?? null,
      mode: (appt as any).mode,
      ip: ip(req),
      ua: ua(req),
    },
  });

  // Fetch student email
  const studentId = String((appt as any).student_id);
  const student = await User.findOne({
    $or: [
      { _id: studentId },
      { id: studentId },
      { auth_id: studentId },
      { auth_sub: studentId },
      { external_id: studentId },
      { user_id: studentId },
    ],
  })
    .select({ email: 1 })
    .lean<MinimalUser>();

  let join_url: string | undefined;

  if (next === "accepted") {
    const metaData = {
      user_id: me,
      request_id: reqId(req),
      appointment_id: String(appt._id),
    };

    // Video session
    if ((appt as any).mode === "video") {
      // Keep a record if you want audits; Metered doesn't need this token hash
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

      join_url = buildJoinUrl(String((appt as any)._id));
      await sendVideoSessionEmail(
        student?.email!,
        new Date((appt as any).scheduled_at),
        join_url,
        metaData
      );
    }

    // Chat session
    if ((appt as any).mode === "chat") {
      await ChatMessageModel.create({
        session_id: (appt as any)._id,
        sender_id: String((appt as any).counselor_id),
        content:
          "Hello! Your chat session is now open. How can I support you today?",
        is_system: true,
      } as any);

      const chatLink = `${env.APP_FRONTEND_URL.replace(
        /\/+$/,
        ""
      )}/appointments/${String((appt as any)._id)}?tab=chat`;

      await sendChatSessionEmail(student?.email!, chatLink, metaData);
    }

    // In-person session
    if ((appt as any).mode === "in-person") {
      const details = `${new Date(
        (appt as any).scheduled_at
      ).toLocaleString()} at ${
        (appt as any).in_person_location || "counseling office"
      }`;

      await sendInPersonSessionEmail(student?.email!, details, metaData);
    }
  }

  const payload = (appt as any).toObject
    ? (appt as any).toObject()
    : (appt as any);
  return res.json({ ...payload, ...(join_url ? { join_url } : {}) });
}

export async function listMyAppointments(req: AuthedRequest, res: Response) {
  const role = req.user?.role;
  const me = authSub(req);

  if (!me) {
    await writeAdminLog({
      level: "warn",
      module: "appointments",
      message: "List mine: no auth sub",
      user_id: "",
      request_id: reqId(req),
      meta: { role, ip: ip(req), ua: ua(req) },
    });
    return res.json([]);
  }

  const query =
    role === "student"
      ? { student_id: me }
      : role === "counselor"
      ? { counselor_id: me }
      : {};

  const items = await AppointmentModel.find(query)
    .sort({ scheduled_at: -1 })
    .lean();

  const enriched = items.map((i: any) =>
    i.mode === "video" && i.status === "accepted"
      ? { ...i, join_url: buildJoinUrl(String(i._id)) }
      : i
  );

  await writeAdminLog({
    level: "info",
    module: "appointments",
    message: "List mine",
    user_id: me,
    request_id: reqId(req),
    meta: { role, count: items.length, ip: ip(req), ua: ua(req) },
  });

  return res.json(enriched);
}

export async function getAppointment(req: AuthedRequest, res: Response) {
  const id = String(req.params?.id ?? "");
  if (!isValidObjectId(id)) {
    await writeAdminLog({
      level: "warn",
      module: "appointments",
      message: "Get: invalid id",
      user_id: authSub(req),
      request_id: reqId(req),
      meta: { id, ip: ip(req), ua: ua(req) },
    });
    return res.status(400).json({ error: "Invalid appointment id" });
  }

  const appt = await AppointmentModel.findById(id).lean();
  if (!appt) {
    await writeAdminLog({
      level: "warn",
      module: "appointments",
      message: "Get: not found",
      user_id: authSub(req),
      request_id: reqId(req),
      meta: { id, ip: ip(req), ua: ua(req) },
    });
    return res.status(404).json({ error: "Not found" });
  }

  const me = authSub(req);
  const studentId = String((appt as any).student_id);
  const counselorId = String((appt as any).counselor_id);

  if (
    !me ||
    (!([studentId, counselorId] as string[]).includes(me) &&
      req.user?.role !== "admin")
  ) {
    await writeAdminLog({
      level: "warn",
      module: "appointments",
      message: "Get: forbidden",
      user_id: me,
      request_id: reqId(req),
      meta: { id: String((appt as any)._id), ip: ip(req), ua: ua(req) },
    });
    return res.status(403).json({ error: "Forbidden" });
  }

  let join_url: string | undefined;
  if ((appt as any).mode === "video" && (appt as any).status === "accepted") {
    join_url = buildJoinUrl(String((appt as any)._id));
  }

  await writeAdminLog({
    level: "info",
    module: "appointments",
    message: "Get: success",
    user_id: me,
    request_id: reqId(req),
    meta: { id: String((appt as any)._id), ip: ip(req), ua: ua(req) },
  });

  return res.json({ ...appt, ...(join_url ? { join_url } : {}) });
}
