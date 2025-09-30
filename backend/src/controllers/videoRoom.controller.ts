import { Response } from "express";
import { AuthedRequest } from "../middleware/requireAuth";
import { VideoRoomModel } from "../models/videoRoom.model";
import { randomBytes } from "crypto";
import mongoose from "mongoose";
import { writeAdminLog } from "./adminLogs.controller"; // ✅ logging

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

// Create a new ad-hoc video room
export async function createVideoRoom(req: AuthedRequest, res: Response) {
  try {
    if (!["student", "counselor"].includes(req.user!.role)) {
      await writeAdminLog({
        level: "warn",
        module: "video",
        message: "Create room: forbidden role",
        user_id: String(req.user?.sub ?? ""),
        request_id: reqId(req),
        meta: { role: req.user?.role, ip: ip(req), ua: ua(req) },
      });
      return res
        .status(403)
        .json({ error: "Only students/counselors can create a room" });
    }

    const token = randomBytes(24).toString("hex");

    const room = await VideoRoomModel.create({
      created_by: new mongoose.Types.ObjectId(req.user!.sub),
      participants: [new mongoose.Types.ObjectId(req.user!.sub)],
      session_token: token,
    });

    await writeAdminLog({
      level: "audit",
      module: "video",
      message: "Create room: success",
      user_id: String(req.user!.sub),
      request_id: reqId(req),
      meta: {
        room_id: String(room._id),
        participants: room.participants.map((p) => String(p)),
        token_len: token.length, // don’t log raw token
        ip: ip(req),
        ua: ua(req),
      },
    });

    res.json({ roomId: room._id, token });
  } catch (e: any) {
    await writeAdminLog({
      level: "error",
      module: "video",
      message: "Create room: server error",
      user_id: String(req.user?.sub ?? ""),
      request_id: reqId(req),
      meta: { error: String(e?.message || e), ip: ip(req), ua: ua(req) },
    });
    res.status(500).json({ error: "Server error" });
  }
}

// ---------------------------
// Join an ad-hoc video room
// ---------------------------
export async function joinVideoRoom(req: AuthedRequest, res: Response) {
  try {
    const room = await VideoRoomModel.findById(req.params.roomId);

    if (!room || !room.active) {
      await writeAdminLog({
        level: "warn",
        module: "video",
        message: "Join room: not available",
        user_id: String(req.user?.sub ?? ""),
        request_id: reqId(req),
        meta: {
          room_id: req.params.roomId,
          active: room?.active ?? false,
          ip: ip(req),
          ua: ua(req),
        },
      });
      return res.status(404).json({ error: "Room not available" });
    }

    // Allow only student, counselor, or admin
    if (!["student", "counselor", "admin"].includes(req.user!.role)) {
      await writeAdminLog({
        level: "warn",
        module: "video",
        message: "Join room: forbidden role",
        user_id: String(req.user?.sub ?? ""),
        request_id: reqId(req),
        meta: {
          room_id: String(room._id),
          role: req.user?.role,
          ip: ip(req),
          ua: ua(req),
        },
      });
      return res.status(403).json({ error: "Forbidden" });
    }

    // Add participant if not already in
    const alreadyJoined = room.participants
      .map((p) => String(p))
      .includes(req.user!.sub);

    if (!alreadyJoined) {
      room.participants.push(new mongoose.Types.ObjectId(req.user!.sub));
      await room.save();
    }

    const rtcConfig = {
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
      message: "Join room: success",
      user_id: String(req.user!.sub),
      request_id: reqId(req),
      meta: {
        room_id: String(room._id),
        already_joined: alreadyJoined,
        participants: room.participants.map((p) => String(p)),
        has_turn: Boolean(process.env.TURN_URL),
        ip: ip(req),
        ua: ua(req),
      },
    });

    res.json({ token: room.session_token, rtcConfig });
  } catch (e: any) {
    await writeAdminLog({
      level: "error",
      module: "video",
      message: "Join room: server error",
      user_id: String(req.user?.sub ?? ""),
      request_id: reqId(req),
      meta: {
        room_id: req.params.roomId,
        error: String(e?.message || e),
        ip: ip(req),
        ua: ua(req),
      },
    });
    res.status(500).json({ error: "Server error" });
  }
}

// ---------------------------
// End an ad-hoc video room
// ---------------------------
export async function endVideoRoom(req: AuthedRequest, res: Response) {
  try {
    const room = await VideoRoomModel.findById(req.params.roomId);

    if (!room) {
      await writeAdminLog({
        level: "warn",
        module: "video",
        message: "End room: not found",
        user_id: String(req.user?.sub ?? ""),
        request_id: reqId(req),
        meta: { room_id: req.params.roomId, ip: ip(req), ua: ua(req) },
      });
      return res.status(404).json({ error: "Not found" });
    }

    const isParticipant = room.participants
      .map((p) => String(p))
      .includes(req.user!.sub);

    if (!isParticipant && req.user!.role !== "admin") {
      await writeAdminLog({
        level: "warn",
        module: "video",
        message: "End room: forbidden",
        user_id: String(req.user?.sub ?? ""),
        request_id: reqId(req),
        meta: {
          room_id: String(room._id),
          role: req.user?.role,
          participants: room.participants.map((p) => String(p)),
          ip: ip(req),
          ua: ua(req),
        },
      });
      return res.status(403).json({ error: "Forbidden" });
    }

    room.active = false;
    await room.save();

    await writeAdminLog({
      level: "audit",
      module: "video",
      message: "End room: success",
      user_id: String(req.user!.sub),
      request_id: reqId(req),
      meta: {
        room_id: String(room._id),
        participants: room.participants.map((p) => String(p)),
        ip: ip(req),
        ua: ua(req),
      },
    });

    res.json({ success: true });
  } catch (e: any) {
    await writeAdminLog({
      level: "error",
      module: "video",
      message: "End room: server error",
      user_id: String(req.user?.sub ?? ""),
      request_id: reqId(req),
      meta: {
        room_id: req.params.roomId,
        error: String(e?.message || e),
        ip: ip(req),
        ua: ua(req),
      },
    });
    res.status(500).json({ error: "Server error" });
  }
}
