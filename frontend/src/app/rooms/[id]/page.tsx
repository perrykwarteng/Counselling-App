"use client";

import VideoCallUI from "@/components/VideoCallUI/VideoCallUI";
import { VideoSessionProvider } from "@/Context/VideoSessionProvider";
import { useAuth } from "@/Context/AuthProvider";
import { useParams } from "next/navigation";

export default function RoomCall() {
  const { user } = useAuth();
  const params = useParams();

  // ✅ Safely extract roomId
  const roomIdParam = params?.id;
  const roomId = Array.isArray(roomIdParam) ? roomIdParam[0] : roomIdParam;

  // ✅ Normalize API base
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE || "/api").replace(
    /\/$/,
    ""
  );

  // ✅ Handle user details safely
  const userId = (user?.id || (user as any)?._id) as string | undefined;
  const role = (user?.role as "student" | "counselor" | "admin") ?? "student";
  const displayName = (user as any)?.name || userId || "You";

  if (!roomId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Room</h1>
          <p className="text-gray-400">The room ID is missing or invalid.</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-400">Please log in to join this room.</p>
        </div>
      </div>
    );
  }

  return (
    <VideoSessionProvider
      userId={userId}
      role={role}
      displayName={displayName}
      apiBase={apiBase}
    >
      <VideoCallUI kind="room" roomId={roomId} userId={userId} role={role} />
    </VideoSessionProvider>
  );
}
