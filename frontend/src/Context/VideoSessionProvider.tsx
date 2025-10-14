"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
  useCallback,
} from "react";
import io, { Socket } from "socket.io-client";

/* ================== Types ================== */
export type Role = "student" | "counselor" | "admin";
export type Kind = "room" | "appointment";
type ProviderKind = "metered" | "native";

export interface SessionInfo {
  kind: Kind;
  id: string;
  provider: ProviderKind;
  // Native
  token?: string;
  rtcConfig?: RTCConfiguration;
  // Metered
  roomName?: string;
  domain?: string; // host only, e.g. "your-subdomain.metered.live"
  accessToken?: string; // Metered access token
  iceServers?: RTCIceServer[];
}

export interface Participant {
  id: string;
  name: string;
  stream: MediaStream | null;
  micOn: boolean;
  videoOn: boolean;
}

export interface ChatMessage {
  id?: string;
  sender: string;
  text: string;
}

export type JoinArgs = {
  stream?: MediaStream | null;
  sessionId?: string;
};

export type VideoContextType = {
  session: SessionInfo | null;
  localStream: MediaStream | null;
  participants: Participant[];
  remoteStreams: { id: string; name: string; stream: MediaStream }[];
  messages: ChatMessage[];
  fetchSession: (id: string, kind: Kind) => Promise<void>;
  join: (args?: JoinArgs) => Promise<void>;
  leave: () => Promise<void>;
  toggleAudio: (force?: boolean) => Promise<void>;
  toggleVideo: (force?: boolean) => Promise<void>;
  startScreenShare: () => Promise<void>;
  sendChat: (msg: { text: string }) => void;
};

const VideoContext = createContext<VideoContextType | undefined>(undefined);
export const useVideo = () => {
  const ctx = useContext(VideoContext);
  if (!ctx)
    throw new Error("useVideo must be used within VideoSessionProvider");
  return ctx;
};

/* ================== Utils ================== */
const rid = () => Math.random().toString(36).slice(2, 10);

declare global {
  interface Window {
    Metered?: any; // provided by CDN
  }
}

/** Accepts "acme.metered.live" OR "https://acme.metered.live"
 *  Returns { host: "acme.metered.live", url: "https://acme.metered.live" } */
function normalizeMeteredDomain(input: string) {
  const trimmed = (input || "").trim();
  const withoutProto = trimmed.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  if (!/^[a-z0-9-]+\.metered\.(live|ca)$/i.test(withoutProto)) {
    throw new Error(
      `Invalid Metered domain: "${input}". Expected "your-subdomain.metered.live".`
    );
  }
  return { host: withoutProto, url: `https://${withoutProto}` };
}

/* ================== Props ================== */
type ProviderProps = {
  children: ReactNode;
  userId: string;
  role: Role;
  displayName?: string;
  /** API base: "/api" | "http://localhost:4000/api" */
  apiBase?: string;
};

export const VideoSessionProvider = ({
  children,
  userId,
  role,
  displayName,
  apiBase = "/api",
}: ProviderProps) => {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Native refs
  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  // Metered refs
  const meteredMeetingRef = useRef<any | null>(null);

  const remoteStreams = useMemo(
    () =>
      participants
        .filter((p) => p.stream)
        .map((p) => ({ id: p.id, name: p.name, stream: p.stream! })),
    [participants]
  );

  /* ========== Resolve API base (dev fallback to :4000) ========== */
  const baseApi = useMemo(() => {
    let base = (apiBase || "").trim();
    if (!base) base = "/api";
    if (
      typeof window !== "undefined" &&
      !/^https?:\/\//i.test(base) &&
      window.location.hostname === "localhost" &&
      window.location.port === "3000"
    ) {
      base = "http://localhost:4000/api";
    }
    return base.replace(/\/+$/, "");
  }, [apiBase]);

  /** Sockets use the same host as the API (strip trailing /api) */
  const socketBase = useMemo(() => {
    if (/^https?:\/\//i.test(baseApi)) return baseApi.replace(/\/api$/, "");
    if (typeof window !== "undefined") return window.location.origin;
    return "";
  }, [baseApi]);

  /* ================== Cleanup ================== */
  const cleanupConnections = useCallback(() => {
    try {
      socketRef.current?.disconnect();
    } catch {}
    socketRef.current = null;

    try {
      pcRef.current?.close();
    } catch {}
    pcRef.current = null;

    try {
      meteredMeetingRef.current?.leaveMeeting?.();
    } catch {}
    meteredMeetingRef.current = null;

    localStream?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);

    setParticipants([]);
  }, [localStream]);

  useEffect(() => {
    return () => {
      cleanupConnections();
    };
  }, [cleanupConnections]);

  /* ========== Fetch session from API (fixed paths) ========== */
  const fetchSession = useCallback(
    async (id: string, kind: Kind) => {
      const isAppt = kind === "appointment";
      const url = isAppt
        ? `${baseApi}/video/video/${id}/join-token` // ✅ correct path
        : `${baseApi}/video/video-rooms/${id}/join`; // ✅ correct path

      const response = await fetch(url, {
        method: isAppt ? "GET" : "POST",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch session: ${response.status}`);
      }
      const data = await response.json();
      const provider = (data.provider as ProviderKind) || "native";

      if (provider === "metered") {
        // Prefer domain from backend; fallback to env or helper endpoint
        let domain: string | undefined =
          data.domain || process.env.NEXT_PUBLIC_METERED_DOMAIN;
        if (!domain) {
          try {
            const resp = await fetch(`${baseApi}/metered-domain`, {
              credentials: "include",
            });
            const d = await resp.json().catch(() => null);
            domain = d?.domain;
          } catch {}
        }
        if (!domain) throw new Error("Metered domain not provided");

        const { host } = normalizeMeteredDomain(domain);

        setSession({
          kind,
          id,
          provider: "metered",
          roomName: data.roomName,
          domain: host, // store clean host only
          accessToken: data.token,
          iceServers: data.iceServers,
        });
        return;
      }

      // Native (if you support it)
      setSession({
        kind,
        id,
        provider: "native",
        token: data.token,
        rtcConfig: data.rtcConfig,
      });
    },
    [baseApi]
  );

  /* ================== Metered SDK loader ================== */
  const loadMeteredSDK = useCallback(async () => {
    if (window.Metered?.Meeting) return window.Metered;
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "//cdn.metered.ca/sdk/video/1.4.6/sdk.min.js";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load Metered SDK"));
      document.head.appendChild(s);
    });
    if (!window.Metered?.Meeting) {
      throw new Error("Metered SDK not available after load");
    }
    return window.Metered;
  }, []);

  /* ================== Join (provider-aware) ================== */
  const join = useCallback(
    async (args?: JoinArgs) => {
      if (!session) throw new Error("No session. Call fetchSession first.");

      /* ---------- METERED ---------- */
      if (session.provider === "metered") {
        const Metered = await loadMeteredSDK();
        const { url: meteredBase } = normalizeMeteredDomain(session.domain!);
        const roomURL = `${meteredBase}/${session.roomName}`;

        const meeting = new Metered.Meeting();
        meteredMeetingRef.current = meeting;

        // Local tracks
        meeting.on("localTrackStarted", ({ track }: any) => {
          const stream = new MediaStream([track]);
          setLocalStream(stream);
        });
        meeting.on("localTrackStopped", () => {
          setLocalStream(null);
        });

        // Remote tracks
        meeting.on("remoteTrackStarted", ({ participant, stream }: any) => {
          const id = participant?.id || stream?.id || rid();
          setParticipants((prev) => {
            const found = prev.find((p) => p.id === id);
            if (found)
              return prev.map((p) => (p.id === id ? { ...p, stream } : p));
            return [
              ...prev,
              {
                id,
                name: participant?.name || `User ${id.slice(0, 6)}`,
                stream,
                micOn: true,
                videoOn: true,
              },
            ];
          });
        });
        meeting.on("remoteTrackStopped", ({ participant }: any) => {
          const id = participant?.id;
          if (!id) return;
          setParticipants((prev) => prev.filter((p) => p.id !== id));
        });
        meeting.on("participantLeft", ({ participant }: any) => {
          const id = participant?.id;
          if (!id) return;
          setParticipants((prev) => prev.filter((p) => p.id !== id));
        });

        // Join with token
        try {
          await meeting.join({
            roomURL,
            accessToken: session.accessToken,
            name: displayName || userId,
          });
        } catch (e: any) {
          console.error("[metered] joinMeetingError:", e?.message || e);
          throw e;
        }

        // Optionally start audio/video immediately
        try {
          await meeting.startAudio();
        } catch {}
        try {
          await meeting.startVideo();
        } catch {}

        // Optional: socket for chat/presence parity
        const socket = io(socketBase, {
          withCredentials: true,
          transports: ["websocket", "polling"],
          auth:
            session.kind === "appointment"
              ? { userId, role, appointmentId: session.id }
              : { userId, role, roomId: session.id },
        });
        socketRef.current = socket;

        socket.on("presence:joined", ({ userId: joinedUserId }: any) =>
          console.log("User joined:", joinedUserId)
        );
        socket.on("presence:left", ({ userId: leftUserId }: any) => {
          setParticipants((prev) => prev.filter((p) => p.id !== leftUserId));
        });
        socket.on("chat:message", (msg: { sender: string; text: string }) => {
          setMessages((prev) => [...prev, { ...msg, id: rid() }]);
        });
        socket.on("connect_error", (err) =>
          console.error("Socket error:", err)
        );

        return;
      }

      /* ---------- NATIVE (socket + RTCPeerConnection) ---------- */
      let stream = args?.stream ?? localStream;
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30, max: 60 },
            },
          });
        } catch {
          stream = null;
        }
      }
      if (stream) setLocalStream(stream);

      const pc = new RTCPeerConnection(
        session.rtcConfig || {
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        }
      );
      pcRef.current = pc;

      if (stream) stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (!remoteStream) return;
        setParticipants((prev) => {
          const found = prev.find((p) => p.id === remoteStream.id);
          if (found)
            return prev.map((p) =>
              p.id === remoteStream.id ? { ...p, stream: remoteStream } : p
            );
          return [
            ...prev,
            {
              id: remoteStream.id,
              name: `User ${remoteStream.id.slice(0, 6)}`,
              stream: remoteStream,
              micOn: true,
              videoOn: true,
            },
          ];
        });
      };

      const socket = io(socketBase, {
        withCredentials: true,
        transports: ["websocket", "polling"],
        auth:
          session.kind === "appointment"
            ? { userId, role, appointmentId: session.id }
            : { userId, role, roomId: session.id, roomToken: session.token },
      });
      socketRef.current = socket;

      socket.on("connect", async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          if (session.kind === "appointment") {
            socket.emit("webrtc:offer", {
              appointmentId: session.id,
              sdp: offer,
            });
          } else {
            socket.emit("webrtc:offer", { roomId: session.id, sdp: offer });
          }
        } catch (err) {
          console.error("Offer error:", err);
        }
      });

      socket.on("webrtc:offer", async ({ sdp }: any) => {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          if (session.kind === "appointment") {
            socket.emit("webrtc:answer", {
              appointmentId: session.id,
              sdp: answer,
              userId,
            });
          } else {
            socket.emit("webrtc:answer", {
              roomId: session.id,
              sdp: answer,
              userId,
            });
          }
        } catch (err) {
          console.error("Handle offer error:", err);
        }
      });

      socket.on("webrtc:answer", async ({ sdp }: any) => {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        } catch (err) {
          console.error("Set remote desc error:", err);
        }
      });

      socket.on("webrtc:ice-candidate", async ({ candidate }: any) => {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Add ICE error:", e);
        }
      });

      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        if (session.kind === "appointment") {
          socket.emit("webrtc:ice-candidate", {
            appointmentId: session.id,
            candidate: event.candidate,
            userId,
          });
        } else {
          socket.emit("webrtc:ice-candidate", {
            roomId: session.id,
            candidate: event.candidate,
            userId,
          });
        }
      };

      socket.on("presence:joined", ({ userId: joinedUserId }: any) =>
        console.log("User joined:", joinedUserId)
      );
      socket.on("presence:left", ({ userId: leftUserId }: any) => {
        setParticipants((prev) => prev.filter((p) => p.id !== leftUserId));
      });
      socket.on("chat:message", (msg: { sender: string; text: string }) => {
        setMessages((prev) => [...prev, { ...msg, id: rid() }]);
      });
      socket.on("connect_error", (err) => console.error("Socket error:", err));
    },
    [
      session,
      localStream,
      socketBase,
      userId,
      role,
      loadMeteredSDK,
      displayName,
    ]
  );

  /* ================== Leave ================== */
  const leave = useCallback(async () => {
    try {
      if (session?.provider === "metered") {
        await meteredMeetingRef.current?.leaveMeeting?.();
      } else {
        socketRef.current?.disconnect();
        socketRef.current = null;
      }
    } finally {
      cleanupConnections();
      setMessages([]);
      setSession(null);
    }
  }, [cleanupConnections, session?.provider]);

  /* ================== Toggles ================== */
  const toggleAudio = useCallback(
    async (force?: boolean) => {
      if (!session) return;
      if (session.provider === "metered") {
        const meeting = meteredMeetingRef.current;
        if (!meeting) return;
        const hasAudio = !!meeting.getLocalAudioTrack?.();
        if (typeof force === "boolean") {
          if (force) await meeting.startAudio();
          else await meeting.stopAudio();
        } else {
          if (hasAudio) await meeting.stopAudio();
          else await meeting.startAudio();
        }
        return;
      }
      if (!localStream) return;
      const tracks = localStream.getAudioTracks();
      const next =
        typeof force === "boolean" ? force : !tracks.some((t) => t.enabled);
      tracks.forEach((t) => (t.enabled = next));
    },
    [session, localStream]
  );

  const toggleVideo = useCallback(
    async (force?: boolean) => {
      if (!session) return;
      if (session.provider === "metered") {
        const meeting = meteredMeetingRef.current;
        if (!meeting) return;
        const hasVideo = !!meeting.getLocalVideoTrack?.();
        if (typeof force === "boolean") {
          if (force) await meeting.startVideo();
          else await meeting.stopVideo();
        } else {
          if (hasVideo) await meeting.stopVideo();
          else await meeting.startVideo();
        }
        return;
      }
      if (!localStream) return;
      const tracks = localStream.getVideoTracks();
      const next =
        typeof force === "boolean" ? force : !tracks.some((t) => t.enabled);
      tracks.forEach((t) => (t.enabled = next));
    },
    [session, localStream]
  );

  const startScreenShare = useCallback(async () => {
    if (!session) return;
    if (session.provider === "metered") {
      const meeting = meteredMeetingRef.current;
      if (!meeting) return;
      await meeting.startScreenShare();
      return;
    }
    const pc = pcRef.current;
    if (!pc || !localStream) return;
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
    });
    const displayTrack = displayStream.getVideoTracks()[0];
    const sender = pc.getSenders().find((s) => s.track?.kind === "video");
    if (sender) await sender.replaceTrack(displayTrack);
    displayTrack.onended = async () => {
      const camTrack = localStream.getVideoTracks()[0];
      if (sender && camTrack) await sender.replaceTrack(camTrack);
    };
  }, [session, localStream]);

  /* ================== Chat (Socket.IO) ================== */
  const sendChat = useCallback(
    (msg: { text: string }) => {
      if (!session) return;

      const payload: ChatMessage = { id: rid(), sender: "You", text: msg.text };
      setMessages((prev) => [...prev, payload]);

      const socket = socketRef.current;
      if (!socket) return;
      const socketPayload =
        session.kind === "appointment"
          ? { session_id: session.id, sender: userId, text: msg.text }
          : { room_id: session.id, sender: userId, text: msg.text };
      socket.emit("chat:message", socketPayload);
    },
    [session, userId]
  );

  const value: VideoContextType = {
    session,
    localStream,
    participants,
    remoteStreams,
    messages,
    fetchSession,
    join,
    leave,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    sendChat,
  };

  return (
    <VideoContext.Provider value={value}>{children}</VideoContext.Provider>
  );
};
