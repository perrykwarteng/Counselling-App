import { Server as HTTPServer } from "http";
import { Server } from "socket.io";
import crypto from "crypto";
import { AppointmentModel } from "./models/appointment.model";
import { VideoRoomModel } from "./models/videoRoom.model";
import { env } from "./config"; // if you export config instead, switch to: import { config as env } from "./config";

const VIDEO_PROVIDER = (env.VIDEO_PROVIDER || "native").toLowerCase();

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

type AuthCtx = {
  userId: string;
  role?: string;
  appointmentId?: string;
  roomId?: string;
};

export function setupSockets(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.APP_FRONTEND_URL, credentials: true },
  });

  io.use(async (socket, next) => {
    try {
      const auth = socket.handshake.auth || {};
      const userId = String(auth.userId || "");
      const role = auth.role ? String(auth.role) : undefined;
      const appointmentId = auth.appointmentId
        ? String(auth.appointmentId)
        : undefined;
      const roomId = auth.roomId ? String(auth.roomId) : undefined;

      if (!userId) return next(new Error("unauthorized"));

      if (appointmentId) {
        const appt = await AppointmentModel.findById(appointmentId).lean();
        const allowed =
          appt &&
          ([
            String((appt as any).student_id),
            String((appt as any).counselor_id),
          ].includes(userId) ||
            role === "admin");
        if (!allowed) return next(new Error("forbidden"));
      }

      if (roomId) {
        const room = await VideoRoomModel.findById(roomId).lean();
        if (!room || !(room as any).active)
          return next(new Error("room_not_active"));

        const isParticipant = (room as any).participants
          .map((p: any) => String(p))
          .includes(userId);
        if (!isParticipant && role !== "admin")
          return next(new Error("forbidden"));

        // Native provider: validate our own room token hash.
        if (VIDEO_PROVIDER === "native") {
          const raw = String(auth.roomToken || "");
          if (!raw) return next(new Error("missing_room_token"));
          const hash = sha256(raw);
          if (hash !== (room as any).session_token_hash)
            return next(new Error("invalid_room_token"));
        }
        // Metered: no socket-level token check needed; Metered handles A/V signaling.
      }

      (socket as any).auth = { userId, role, appointmentId, roomId } as AuthCtx;
      console.log("[SOCKET AUTH OK]", {
        userId,
        role,
        appointmentId,
        roomId,
        provider: VIDEO_PROVIDER,
      });
      next();
    } catch (e) {
      console.error("[SOCKET AUTH ERR]", e);
      next(e as any);
    }
  });

  io.on("connection", (socket) => {
    const { appointmentId, roomId, userId } = (socket as any).auth as AuthCtx;
    console.log("[SOCKET CONNECT]", {
      userId,
      appointmentId,
      roomId,
      id: socket.id,
    });

    if (appointmentId) {
      const room = `apt:${appointmentId}`;
      socket.join(room);
      socket.to(room).emit("presence:joined", { userId });
    }
    if (roomId) {
      const room = `room:${roomId}`;
      socket.join(room);
      socket.to(room).emit("presence:joined", { userId });
    }

    // Chat stays provider-agnostic
    socket.on("chat:message", (msg: any) => {
      if (msg?.session_id)
        socket
          .to(`apt:${msg.session_id}`)
          .emit("chat:message", { sender: msg.sender, text: msg.text });
      if (msg?.room_id)
        socket
          .to(`room:${msg.room_id}`)
          .emit("chat:message", { sender: msg.sender, text: msg.text });
    });

    // Only handle WebRTC signaling if we're in the native provider
    socket.on("webrtc:offer", ({ appointmentId, roomId, sdp }) => {
      if (VIDEO_PROVIDER !== "native") return;
      if (appointmentId)
        socket
          .to(`apt:${appointmentId}`)
          .emit("webrtc:offer", { sdp, from: userId });
      if (roomId)
        socket.to(`room:${roomId}`).emit("webrtc:offer", { sdp, from: userId });
    });

    socket.on(
      "webrtc:answer",
      ({ appointmentId, roomId, sdp, userId: from }) => {
        if (VIDEO_PROVIDER !== "native") return;
        if (appointmentId)
          socket
            .to(`apt:${appointmentId}`)
            .emit("webrtc:answer", { sdp, from });
        if (roomId)
          socket.to(`room:${roomId}`).emit("webrtc:answer", { sdp, from });
      }
    );

    socket.on(
      "webrtc:ice-candidate",
      ({ appointmentId, roomId, candidate, userId: from }) => {
        if (VIDEO_PROVIDER !== "native") return;
        if (appointmentId)
          socket
            .to(`apt:${appointmentId}`)
            .emit("webrtc:ice-candidate", { candidate, from });
        if (roomId)
          socket
            .to(`room:${roomId}`)
            .emit("webrtc:ice-candidate", { candidate, from });
      }
    );

    socket.on("disconnect", (reason) => {
      console.log("[SOCKET DISCONNECT]", { id: socket.id, reason });
      if (appointmentId)
        socket.to(`apt:${appointmentId}`).emit("presence:left", { userId });
      if (roomId) socket.to(`room:${roomId}`).emit("presence:left", { userId });
    });
  });

  return io;
}
