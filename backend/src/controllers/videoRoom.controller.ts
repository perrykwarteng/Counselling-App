import { Request, Response } from "express";
import mongoose, { isValidObjectId } from "mongoose";
import { VideoRoomModel } from "../models/videoRoom.model";
import { writeAdminLog } from "./adminLogs.controller";
import {
  meteredEnsureRoom,
  meteredGenerateAccessToken,
  meteredGetTurnIceServers,
} from "../lib/metered";
import { env } from "../config";

function reqId(req: Request) {
  return (
    ((req as any).request_id as string) ||
    (req.headers["x-request-id"] as string) ||
    undefined
  );
}
function ua(req: Request) {
  return req.get?.("user-agent") || undefined;
}
function ip(req: Request) {
  const xf = (req.headers["x-forwarded-for"] as string) || "";
  const first = xf
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)[0];
  return first || (req as any).ip || undefined;
}

const getDisplayName = (req: Request) =>
  (req as any).user?.name && typeof (req as any).user.name === "string"
    ? (req as any).user.name
    : String((req as any).user?.sub || "");

function meteredSafeRoomName(s: string) {
  return String(s).replace(/[^a-zA-Z0-9_-]/g, "-");
}

/* ---------------- controllers ---------------- */

// POST /api/video-rooms
export async function createVideoRoom(req: Request, res: Response) {
  try {
    const role = (req as any).user!.role;
    const me = String((req as any).user!.sub);

    if (!["student", "counselor"].includes(role)) {
      await writeAdminLog({
        level: "warn",
        module: "video",
        message: "Create room: forbidden role",
        user_id: me,
        request_id: reqId(req),
        meta: { role, ip: ip(req), ua: ua(req) },
      });
      return res
        .status(403)
        .json({ error: "Only students/counselors can create a room" });
    }

    const createdBy = new mongoose.Types.ObjectId(me);
    const room = await VideoRoomModel.create({
      created_by: createdBy,
      participants: [createdBy],
      active: true,
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000),
    });

    const roomName = meteredSafeRoomName(`room-${String(room._id)}`);

    await meteredEnsureRoom(roomName);

    const access = await meteredGenerateAccessToken({
      roomName,
      name: getDisplayName(req),
      externalUserId: String((req as any).user!.sub),
      isAdmin: ["admin", "counselor"].includes((req as any).user!.role),
    });

    const iceServers = await meteredGetTurnIceServers();

    await writeAdminLog({
      level: "audit",
      module: "video",
      message: "Create room: metered issued",
      user_id: me,
      request_id: reqId(req),
      meta: {
        room_id: String(room._id),
        participants: room.participants.map((p) => String(p)),
        provider: "metered",
        domain: env.METERED_DOMAIN,
        ip: ip(req),
        ua: ua(req),
      },
    });

    return res.json({
      provider: "metered",
      roomId: room._id,
      token: access.token,
      roomName,
      iceServers,
      domain: env.METERED_DOMAIN,
    });
  } catch (e: any) {
    await writeAdminLog({
      level: "error",
      module: "video",
      message: "Create room: server error",
      user_id: String((req as any).user?.sub ?? ""),
      request_id: reqId(req),
      meta: { error: String(e?.message || e), ip: ip(req), ua: ua(req) },
    });
    return res.status(500).json({ error: "Server error" });
  }
}

export async function joinVideoRoom(req: Request, res: Response) {
  try {
    const role = (req as any).user!.role;
    const me = String((req as any).user!.sub);
    const { roomId } = req.params;
    if (!isValidObjectId(roomId)) {
      await writeAdminLog({
        level: "warn",
        module: "video",
        message: "Join room: invalid id",
        user_id: me,
        request_id: reqId(req),
        meta: { room_id: roomId, ip: ip(req), ua: ua(req) },
      });
      return res.status(400).json({ error: "Invalid room id" });
    }
    const room = await VideoRoomModel.findById(roomId);
    if (!room || !room.active) {
      await writeAdminLog({
        level: "warn",
        module: "video",
        message: "Join room: not available",
        user_id: me,
        request_id: reqId(req),
        meta: {
          room_id: roomId,
          active: room?.active ?? false,
          ip: ip(req),
          ua: ua(req),
        },
      });
      return res.status(404).json({ error: "Room not available" });
    }
    if (!["student", "counselor", "admin"].includes(role)) {
      await writeAdminLog({
        level: "warn",
        module: "video",
        message: "Join room: forbidden role",
        user_id: me,
        request_id: reqId(req),
        meta: {
          room_id: String(room._id),
          role,
          ip: ip(req),
          ua: ua(req),
        },
      });
      return res.status(403).json({ error: "Forbidden" });
    }
    const already_joined = room.participants.map((p) => String(p)).includes(me);
    if (!already_joined) {
      room.participants.push(new mongoose.Types.ObjectId(me));
    }
    room.expires_at = new Date(Date.now() + 2 * 60 * 60 * 1000);
    await room.save();

    const roomName = meteredSafeRoomName(`room-${String(room._id)}`);

    await meteredEnsureRoom(roomName);

    const access = await meteredGenerateAccessToken({
      roomName,
      name: getDisplayName(req),
      externalUserId: String((req as any).user!.sub),
      isAdmin: (req as any).user!.role === "admin",
    });

    const iceServers = await meteredGetTurnIceServers();

    await writeAdminLog({
      level: "audit",
      module: "video",
      message: "Join room: metered issued",
      user_id: me,
      request_id: reqId(req),
      meta: {
        room_id: String(room._id),
        already_joined,
        participants: room.participants.map((p) => String(p)),
        provider: "metered",
        domain: env.METERED_DOMAIN,
        ip: ip(req),
        ua: ua(req),
      },
    });

    return res.json({
      provider: "metered",
      roomId: room._id,
      token: access.token,
      roomName,
      iceServers,
      domain: env.METERED_DOMAIN,
    });
  } catch (e: any) {
    await writeAdminLog({
      level: "error",
      module: "video",
      message: "Join room: server error",
      user_id: String((req as any).user?.sub ?? ""),
      request_id: reqId(req),
      meta: {
        room_id: req.params.roomId,
        error: String(e?.message || e),
        ip: ip(req),
        ua: ua(req),
      },
    });
    return res.status(500).json({ error: "Server error" });
  }
}

// POST /api/video-rooms/:roomId/end
export async function endVideoRoom(req: Request, res: Response) {
  try {
    const me = String((req as any).user!.sub);
    const role = (req as any).user!.role;
    const { roomId } = req.params;

    if (!isValidObjectId(roomId)) {
      await writeAdminLog({
        level: "warn",
        module: "video",
        message: "End room: invalid id",
        user_id: me,
        request_id: reqId(req),
        meta: { room_id: roomId, ip: ip(req), ua: ua(req) },
      });
      return res.status(400).json({ error: "Invalid room id" });
    }

    const room = await VideoRoomModel.findById(roomId);
    if (!room) {
      await writeAdminLog({
        level: "warn",
        module: "video",
        message: "End room: not found",
        user_id: me,
        request_id: reqId(req),
        meta: { room_id: roomId, ip: ip(req), ua: ua(req) },
      });
      return res.status(404).json({ error: "Not found" });
    }

    const isParticipant = room.participants.map((p) => String(p)).includes(me);
    if (!isParticipant && role !== "admin") {
      await writeAdminLog({
        level: "warn",
        module: "video",
        message: "End room: forbidden",
        user_id: me,
        request_id: reqId(req),
        meta: {
          room_id: String(room._id),
          role,
          participants: room.participants.map((p) => String(p)),
          ip: ip(req),
          ua: ua(req),
        },
      });
      return res.status(403).json({ error: "Forbidden" });
    }

    room.active = false;
    room.expires_at = new Date();
    await room.save();

    await writeAdminLog({
      level: "audit",
      module: "video",
      message: "End room: success",
      user_id: me,
      request_id: reqId(req),
      meta: {
        room_id: String(room._id),
        participants: room.participants.map((p) => String(p)),
        ip: ip(req),
        ua: ua(req),
      },
    });

    return res.json({ success: true });
  } catch (e: any) {
    await writeAdminLog({
      level: "error",
      module: "video",
      message: "End room: server error",
      user_id: String((req as any).user?.sub ?? ""),
      request_id: reqId(req),
      meta: {
        room_id: req.params.roomId,
        error: String(e?.message || e),
        ip: ip(req),
        ua: ua(req),
      },
    });
    return res.status(500).json({ error: "Server error" });
  }
}
