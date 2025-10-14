"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  ScreenShare,
  Monitor,
  Settings,
  Maximize2,
  Grid3x3,
} from "lucide-react";
import { useVideo } from "@/Context/VideoSessionProvider";

export interface VideoCallUIProps {
  kind: "room" | "appointment";
  roomId?: string;
  appointmentId?: string;
  userId: string;
  role: "student" | "counselor" | "admin";
}

type ViewMode = "grid" | "spotlight" | "sidebar";

type ParticipantTile = {
  id: string;
  name: string;
  stream: MediaStream | null;
  isLocal: boolean;
};

export default function VideoCallUI({
  kind,
  roomId,
  appointmentId,
}: VideoCallUIProps) {
  const {
    localStream,
    remoteStreams = [],
    join,
    leave,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    fetchSession,
  } = useVideo();

  const [fallbackLocalStream, setFallbackLocalStream] =
    useState<MediaStream | null>(null);
  const [joined, setJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [mediaReady, setMediaReady] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [spotlightId, setSpotlightId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const effectiveLocalStream = localStream ?? fallbackLocalStream ?? null;

  // Normalize remote streams -> ParticipantTile[]
  const remoteTiles = useMemo<ParticipantTile[]>(
    () =>
      (remoteStreams ?? []).map((rs) => ({
        id: rs.id,
        name: rs.name,
        stream: rs.stream,
        isLocal: false,
      })),
    [remoteStreams]
  );

  useEffect(() => {
    const id = kind === "appointment" ? appointmentId : roomId;
    if (id) fetchSession(id, kind);
  }, [kind, roomId, appointmentId, fetchSession]);

  const syncFromTracks = useCallback((stream: MediaStream | null) => {
    if (!stream) return;
    setMicOn(stream.getAudioTracks().some((t) => t.enabled));
    setVideoOn(stream.getVideoTracks().some((t) => t.enabled));
  }, []);

  const enableCameraAndMic = useCallback(async () => {
    setPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 60 },
        },
      });
      setFallbackLocalStream(stream);
      setMediaReady(true);
      syncFromTracks(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        await localVideoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error("getUserMedia failed:", err);
      let msg = "Camera/Microphone permission denied or no device available.";
      if (err?.name === "NotAllowedError")
        msg = "Permission denied. Allow access in browser settings.";
      else if (err?.name === "NotFoundError")
        msg = "No camera/microphone found.";
      else if (err?.name === "NotReadableError")
        msg = "Device in use by another app.";
      setPermissionError(msg);
      setMediaReady(false);
    }
  }, [syncFromTracks]);

  useEffect(() => {
    const el = localVideoRef.current;
    if (!el) return;
    if (effectiveLocalStream) {
      if (el.srcObject !== effectiveLocalStream)
        el.srcObject = effectiveLocalStream;
      el.muted = true;
      el.play?.().catch(() => {});
    } else {
      el.srcObject = null;
    }
  }, [effectiveLocalStream]);

  const handleJoin = useCallback(
    async (joinAnyway = false) => {
      if (joined || isJoining) return;
      if (!mediaReady && !effectiveLocalStream && !joinAnyway) {
        await enableCameraAndMic();
        if (!fallbackLocalStream && !localStream) {
          setPermissionError("Could not access camera/microphone.");
          return;
        }
      }
      setIsJoining(true);
      try {
        const id = kind === "appointment" ? appointmentId : roomId;
        if (!id) {
          throw new Error(
            kind === "appointment"
              ? "Missing appointmentId."
              : "Missing roomId."
          );
        }
        await fetchSession(id, kind);
        await join({ stream: effectiveLocalStream, sessionId: id });
        setJoined(true);
      } catch (err: any) {
        console.error("Failed to join call:", err);
        alert(err?.message ?? "Join failed.");
      } finally {
        setIsJoining(false);
      }
    },
    [
      joined,
      isJoining,
      kind,
      roomId,
      appointmentId,
      fetchSession,
      join,
      mediaReady,
      effectiveLocalStream,
      fallbackLocalStream,
      localStream,
      enableCameraAndMic,
    ]
  );

  const handleToggleAudio = useCallback(async () => {
    if (!effectiveLocalStream) return;
    const newState = !micOn;
    effectiveLocalStream
      .getAudioTracks()
      .forEach((t) => (t.enabled = newState));
    setMicOn(newState);
    await toggleAudio?.(newState);
  }, [effectiveLocalStream, micOn, toggleAudio]);

  const handleToggleVideo = useCallback(async () => {
    if (!effectiveLocalStream) return;
    const newState = !videoOn;
    effectiveLocalStream
      .getVideoTracks()
      .forEach((t) => (t.enabled = newState));
    setVideoOn(newState);
    await toggleVideo?.(newState);
  }, [effectiveLocalStream, videoOn, toggleVideo]);

  const handleScreenShare = useCallback(async () => {
    if (!joined) return;
    try {
      await startScreenShare?.();
      setIsScreenSharing(true);
    } catch (e) {
      console.error(e);
      alert("Screen sharing failed.");
    }
  }, [joined, startScreenShare]);

  const handleLeave = useCallback(async () => {
    try {
      await leave();
    } finally {
      setJoined(false);
      setMicOn(true);
      setVideoOn(true);
      setIsScreenSharing(false);
      if (localVideoRef.current) localVideoRef.current.srcObject = null;

      if (fallbackLocalStream) {
        fallbackLocalStream.getTracks().forEach((t) => t.stop());
        setFallbackLocalStream(null);
      }
    }
  }, [leave, fallbackLocalStream]);

  const showPermissionOverlay = !joined && !effectiveLocalStream;

  /** ===== Shared local/remote tile renderer for LOCAL tile only (uses ref effect above) ===== */
  const renderLocalTile = (isSpotlight = false, onClick?: () => void) => (
    <div
      className={`relative bg-gray-900 rounded-xl overflow-hidden border border-gray-800 ${
        onClick ? "cursor-pointer hover:border-blue-600" : ""
      } ${isSpotlight ? "h-full" : ""} transition-all group`}
      onClick={onClick}
    >
      <video
        ref={localVideoRef}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
        muted
      />
      {(!videoOn || !effectiveLocalStream) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-2xl font-bold">
            Y
          </div>
        </div>
      )}
      <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-gray-950/80 backdrop-blur-sm rounded-lg text-sm font-medium flex items-center gap-2">
        <span>You</span>
        {!micOn && <MicOff size={14} className="text-red-400" />}
      </div>
    </div>
  );

  const renderGridView = () => {
    const totalParticipants = remoteTiles.length + 1; // local + remotes
    const cols =
      totalParticipants <= 1
        ? 1
        : totalParticipants <= 4
        ? 2
        : totalParticipants <= 9
        ? 3
        : 4;

    return (
      <div
        className="grid gap-3 w-full h-full p-4"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridAutoRows: "1fr",
        }}
      >
        {renderLocalTile(false, () => setSpotlightId("local"))}
        {remoteTiles.map((rs) => (
          <RemoteTile
            key={rs.id}
            name={rs.name}
            stream={rs.stream}
            onClick={() => setSpotlightId(rs.id)}
          />
        ))}
      </div>
    );
  };

  const renderSpotlightView = () => {
    const localTile: ParticipantTile = {
      id: "local",
      name: "You",
      stream: effectiveLocalStream,
      isLocal: true,
    };

    const isLocalSpotlight =
      spotlightId === "local" || (!spotlightId && remoteTiles.length === 0);

    const spotlight: ParticipantTile = isLocalSpotlight
      ? localTile
      : remoteTiles.find((r) => r.id === spotlightId) ??
        remoteTiles[0] ??
        localTile;

    const others: ParticipantTile[] = spotlight.isLocal
      ? remoteTiles
      : [localTile, ...remoteTiles.filter((r) => r.id !== spotlight.id)];

    return (
      <div className="flex flex-col h-full p-4 gap-3">
        <div className="flex-1 relative">
          {spotlight.isLocal ? (
            renderLocalTile(true)
          ) : (
            <RemoteTile name={spotlight.name} stream={spotlight.stream} />
          )}
        </div>
        <div className="flex gap-2 h-32">
          {others.slice(0, 6).map((p) => (
            <div key={p.id} className="flex-1 min-w-0">
              <RemoteTile
                name={p.name}
                stream={p.stream}
                onClick={() => setSpotlightId(p.id)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSidebarView = () => (
    <div className="flex h-full p-4 gap-3">
      <div className="flex-1">{renderLocalTile(true)}</div>
      <div className="w-80 flex flex-col gap-2 overflow-y-auto">
        {remoteTiles.map((rs) => (
          <div key={rs.id} className="h-60">
            <RemoteTile name={rs.name} stream={rs.stream} />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-screen bg-gray-950 text-white overflow-hidden">
      {/* Permission Overlay */}
      {!joined && !effectiveLocalStream && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950 bg-opacity-98 z-50 p-6">
          <div className="max-w-lg w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-6 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <VideoIcon size={32} />
              </div>
              <h2 className="text-2xl font-bold">Ready to Join?</h2>
              <p className="text-gray-400">
                Enable your camera and microphone to get started
              </p>
            </div>
            {permissionError && (
              <div className="text-sm text-red-400 bg-red-950/50 border border-red-800/50 rounded-lg p-4">
                {permissionError}
              </div>
            )}
            <div className="flex flex-col gap-3">
              <button
                onClick={enableCameraAndMic}
                className="w-full px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Enable Camera & Microphone
              </button>
              <button
                onClick={() => handleJoin(true)}
                className="w-full px-6 py-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
                disabled={isJoining}
              >
                {isJoining ? "Joining..." : "Join Without Camera"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-full">
        {!joined && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-950/50 z-10">
            <button
              onClick={() => handleJoin(false)}
              className="px-8 py-4 bg-blue-600 rounded-xl hover:bg-blue-700 transition-all text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Join Call
            </button>
          </div>
        )}

        {viewMode === "grid" && renderGridView()}
        {viewMode === "spotlight" && renderSpotlightView()}
        {viewMode === "sidebar" && renderSidebarView()}
      </div>

      {joined && (
        <>
          <div className="absolute top-4 right-4 flex gap-2 z-20">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-3 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-blue-600"
                  : "bg-gray-800 hover:bg-gray-700"
              }`}
              title="Grid View"
            >
              <Grid3x3 size={20} />
            </button>
            <button
              onClick={() => setViewMode("spotlight")}
              className={`p-3 rounded-lg transition-colors ${
                viewMode === "spotlight"
                  ? "bg-blue-600"
                  : "bg-gray-800 hover:bg-gray-700"
              }`}
              title="Spotlight View"
            >
              <Maximize2 size={20} />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              title="Settings"
            >
              <Settings size={20} />
            </button>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 bg-gray-900/90 backdrop-blur-lg px-6 py-4 rounded-2xl shadow-2xl border border-gray-800 z-20">
            <button
              onClick={handleToggleAudio}
              className={`p-4 rounded-xl transition-all ${
                micOn
                  ? "bg-gray-800 hover:bg-gray-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
              title={micOn ? "Mute" : "Unmute"}
            >
              {micOn ? <Mic size={24} /> : <MicOff size={24} />}
            </button>
            <button
              onClick={handleToggleVideo}
              className={`p-4 rounded-xl transition-all ${
                videoOn
                  ? "bg-gray-800 hover:bg-gray-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
              title={videoOn ? "Stop Video" : "Start Video"}
            >
              {videoOn ? <VideoIcon size={24} /> : <VideoOff size={24} />}
            </button>
            <button
              onClick={handleScreenShare}
              className={`p-4 rounded-xl transition-all ${
                isScreenSharing
                  ? "bg-blue-600"
                  : "bg-gray-800 hover:bg-gray-700"
              }`}
              title="Share Screen"
            >
              {isScreenSharing ? (
                <Monitor size={24} />
              ) : (
                <ScreenShare size={24} />
              )}
            </button>
            <button
              onClick={handleLeave}
              className="p-4 rounded-xl bg-red-600 hover:bg-red-700 transition-all"
              title="Leave Call"
            >
              <PhoneOff size={24} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function RemoteTile({
  name,
  stream,
  onClick,
}: {
  name: string;
  stream?: MediaStream | null;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    if (stream && ref.current.srcObject !== stream) {
      ref.current.srcObject = stream as any;
      ref.current.muted = false;
      ref.current.play?.().catch(() => {});
    }
    return () => {
      if (ref.current) ref.current.srcObject = null;
    };
  }, [stream]);
  return (
    <div
      className={`relative bg-gray-900 rounded-xl overflow-hidden border border-gray-800 ${
        onClick ? "cursor-pointer hover:border-blue-600" : ""
      } transition-all group`}
      onClick={onClick}
    >
      <video
        ref={ref}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
      />
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-2xl font-bold">
            {name.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
      <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-gray-950/80 backdrop-blur-sm rounded-lg text-sm font-medium">
        <span>{name}</span>
      </div>
    </div>
  );
}
