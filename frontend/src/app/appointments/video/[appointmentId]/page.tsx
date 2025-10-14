"use client";

import VideoCallUI from "@/components/VideoCallUI/VideoCallUI";
import { VideoSessionProvider } from "@/Context/VideoSessionProvider";
import { useAuth } from "@/Context/AuthProvider";
import { useParams } from "next/navigation";

export default function AppointmentVideo() {
  const { user } = useAuth();
  const params = useParams();

  // Normalize param (string | string[])
  const raw = (params?.appointmentId ?? "") as string | string[];
  const appointmentId = Array.isArray(raw) ? raw[0] : raw;

  // API base, trailing slash removed
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE || "/api").replace(
    /\/$/,
    ""
  );

  // Normalize user shapes
  const userId = (user?.id || (user as any)?._id) as string | undefined;
  const role = ((user?.role as any) || "student") as
    | "student"
    | "counselor"
    | "admin";
  const displayName = (user as any)?.name || userId || "You";

  if (!appointmentId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Appointment</h1>
          <p className="text-gray-400">
            The appointment ID is missing or invalid.
          </p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-400">
            Please log in to join this appointment.
          </p>
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
      <VideoCallUI
        kind="appointment"
        appointmentId={appointmentId}
        userId={userId}
        role={role}
      />
    </VideoSessionProvider>
  );
}
