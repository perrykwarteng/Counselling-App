import { Server as HTTPServer } from "http";
import { Server } from "socket.io";

export function setupSockets(httpServer: HTTPServer) {
  const io = new Server(httpServer, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    socket.on("room:join", ({ appointmentId, userId }) => {
      const room = `apt:${appointmentId}`;
      socket.join(room);
      socket.to(room).emit("presence:joined", { userId });
    });

    socket.on("chat:message", (msg) => {
      const room = `apt:${msg.session_id}`;
      socket.to(room).emit("chat:message", msg);
    });

    socket.on("chat:typing", ({ session_id, userId }) => {
      socket.to(`apt:${session_id}`).emit("chat:typing", { userId });
    });

    socket.on("webrtc:offer", ({ appointmentId, sdp }) => {
      socket.to(`apt:${appointmentId}`).emit("webrtc:offer", { sdp });
    });
    socket.on("webrtc:answer", ({ appointmentId, sdp }) => {
      socket.to(`apt:${appointmentId}`).emit("webrtc:answer", { sdp });
    });
    socket.on("webrtc:ice-candidate", ({ appointmentId, candidate }) => {
      socket
        .to(`apt:${appointmentId}`)
        .emit("webrtc:ice-candidate", { candidate });
    });
  });

  return io;
}
