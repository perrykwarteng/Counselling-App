"use client";

import { useCallback, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type BaseOpts = {
  kind: "appointment" | "room";
  appointmentId?: string;
  roomId?: string;
  userId: string;
  role: "student" | "counselor" | "admin";
  apiBase: string;
};

type Msg = { sender: string; text: string };
type RemoteStream = { id: string; name: string; stream: MediaStream };
type Participant = { id: string; name: string; micOn: boolean; videoOn: boolean };

export function useNativeVideo(opts: BaseOpts) {
  const { kind, appointmentId, roomId, userId, role, apiBase } = opts;

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const socketRef = useRef<Socket | null>(null);

  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);

  const createPc = useCallback(
    (rtcConfig: RTCConfiguration): RTCPeerConnection => {
      const pc = new RTCPeerConnection(rtcConfig);

      pc.ontrack = (ev) => {
        const [stream] = ev.streams;
        if (!stream) return;
        remoteStreamsRef.current.set(stream.id, stream);
        setRemoteStreams(
          Array.from(remoteStreamsRef.current.entries()).map(([id, s]) => ({
            id,
            name: "Peer",
            stream: s,
          }))
        );
        setParticipants((prev) => {
          const base = prev.filter((p) => p.id !== stream.id);
          return [...base, { id: stream.id, name: "Peer", micOn: true, videoOn: true }];
        });
      };

      return pc;
    },
    []
  );

  const join = useCallback(async () => {
    // 1) Fetch join token
    const isAppt = kind === "appointment";
    const url = isAppt
      ? `${apiBase}/video/${appointmentId}/join-token` // GET
      : `${apiBase}/video-rooms/${roomId}/join`;      // POST

    const r = await fetch(url, {
      credentials: "include",
      method: isAppt ? "GET" : "POST", // <-- important
    });
    if (!r.ok) throw new Error(`join-token failed: ${r.status}`);
    const data = await r.json();
    if (data.provider !== "native") throw new Error("Server returned non-native provider");

    const { token, rtcConfig } = data;

    // 2) Media
    const local = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    localStreamRef.current = local;

    // 3) PC
    const pc = createPc(rtcConfig as RTCConfiguration);
    pcRef.current = pc;

    local.getTracks().forEach((t) => pc.addTrack(t, local));

    // 4) Socket signaling + chat
    const socket = io(apiBase.replace(/\/api$/, ""), {
      withCredentials: true,
      transports: ["websocket"],
      auth: isAppt
        ? { userId, role, appointmentId }
        : { userId, role, roomId, roomToken: token },
    });

    socket.on("connect", async () => {
      // Let the first side that connects create the offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      if (isAppt) socket.emit("webrtc:offer", { appointmentId, sdp: offer });
      else socket.emit("webrtc:offer", { roomId, sdp: offer }); // <-- use roomId
    });

    socket.on("webrtc:offer", async ({ sdp }) => {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      if (isAppt) socket.emit("webrtc:answer", { appointmentId, sdp: answer });
      else socket.emit("webrtc:answer", { roomId, sdp: answer }); // <-- use roomId
    });

    socket.on("webrtc:answer", async ({ sdp }) => {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    socket.on("webrtc:ice-candidate", async ({ candidate }) => {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {}
    });

    pc.onicecandidate = (ev) => {
      if (!ev.candidate) return;
      if (isAppt)
        socket.emit("webrtc:ice-candidate", { appointmentId, candidate: ev.candidate });
      else socket.emit("webrtc:ice-candidate", { roomId, candidate: ev.candidate }); // <-- use roomId
    };

    // Chat: accept 'text' and emit 'text'
    socket.on("chat:message", (msg: { sender: string; text: string }) =>
      setMessages((m) => [...m, msg])
    );

    socketRef.current = socket;

    // Add local participant entry
    setParticipants((prev) => {
      const base = prev.filter((p) => p.id !== "local");
      return [...base, { id: "local", name: "You", micOn: true, videoOn: true }];
    });
  }, [apiBase, appointmentId, roomId, kind, role, userId, createPc]);

  const leave = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;

    const pc = pcRef.current;
    if (pc) {
      pc.getSenders().forEach((s) => s.track?.stop());
      pc.close();
      pcRef.current = null;
    }
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;

    setRemoteStreams([]);
    setParticipants([]);
  }, []);

  const toggleAudio = useCallback((on: boolean) => {
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = on));
    setMicOn(on);
  }, []);

  const toggleVideo = useCallback((on: boolean) => {
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = on));
    setVideoOn(on);
  }, []);

  const startScreenShare = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    const displayStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
    const screenTrack = displayStream.getVideoTracks()[0];
    const sender = pc.getSenders().find((s) => s.track?.kind === "video");
    if (sender && screenTrack) {
      await sender.replaceTrack(screenTrack);
      setScreenSharing(true);
      screenTrack.onended = async () => {
        const camTrack = localStreamRef.current?.getVideoTracks()[0];
        if (camTrack) await sender.replaceTrack(camTrack);
        setScreenSharing(false);
      };
    }
  }, []);

  const stopScreenShare = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    const sender = pc.getSenders().find((s) => s.track?.kind === "video");
    const camTrack = localStreamRef.current?.getVideoTracks()[0];
    if (sender && camTrack) {
      await sender.replaceTrack(camTrack);
      setScreenSharing(false);
    }
  }, []);

  const sendChat = useCallback(
    ({ text }: { text: string }) => {
      setMessages((m) => [...m, { sender: "You", text }]);
      const socket = socketRef.current;
      if (!socket) return;
      const payload =
        kind === "appointment"
          ? { session_id: appointmentId, sender: userId, text }
          : { room_id: roomId, sender: userId, text };
      socket.emit("chat:message", payload);
    },
    [appointmentId, roomId, userId, kind]
  );

  return {
    state: {
      micOn,
      videoOn,
      screenSharing,
      messages,
      participants,
      remoteStreams,
      localStream: localStreamRef.current,
    },
    join,
    leave,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    sendChat,
  };
}
