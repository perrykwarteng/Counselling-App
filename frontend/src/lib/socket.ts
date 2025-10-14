import { io } from "socket.io-client";

export const socket = io(
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
  {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    auth: {
      userId: "USER_ID_HERE", // must match server
      role: "student", // or counselor, admin
      appointmentId: "APPOINTMENT_ID",
      roomId: "ROOM_ID",
      roomToken: "TOKEN_IF_REQUIRED",
    },
  }
);
