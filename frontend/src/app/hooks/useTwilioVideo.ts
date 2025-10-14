"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  connect,
  Room,
  LocalAudioTrack,
  LocalVideoTrack,
  RemoteParticipant,
  Participant,
  createLocalTracks,
  TrackPublication,
  RemoteTrackPublication,
  LocalTrackPublication,
  AudioTrack,
  VideoTrack,
} from "twilio-video";
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

/* ---------- Type guards ---------- */

// Remote publication?
function isRemotePub(pub: TrackPublication): pub is RemoteTrackPublication {
  return typeof (pub as RemoteTrackPublication).isSubscribed === "boolean";
}

// Is a media track (audio/video) that supports attach/detach?
function isMediaTrack(t: unknown): t is AudioTrack | VideoTrack {
  return (
    !!t &&
    typeof (t as any).attach === "function" &&
    typeof (t as any).detach === "function"
  );
}

// Local media track (audio/video) that has enable/disable + attach?
function isLocalMediaTrack(t: unknown): t is LocalAudioTrack | LocalVideoTrack {
  return (
    !!t &&
    typeof (t as any).enable === "function" &&
    typeof (t as any).attach === "function"
  );
}

/* --------------------------------- */

export function useTwilioVideo(opts: BaseOpts) {
  const { kind, appointmentId, roomId, userId, role, apiBase } = opts;

  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [participants, setParticipants] = useState<
    { id: string; name: string; micOn: boolean; videoOn: boolean }[]
  >([]);

  const roomRef = useRef<Room | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const localContainerId = "twilio-local-container";
  const remoteContainerId = "twilio-remote-container";

  const appendParticipant = (p: Participant, containerId: string) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Attach current subscribed media tracks
    p.tracks.forEach((pub) => {
      if (
        isRemotePub(pub) &&
        pub.isSubscribed &&
        pub.track &&
        isMediaTrack(pub.track)
      ) {
        const el = pub.track.attach();
        container.appendChild(el);
      }
    });

    // Subscribe/unsubscribe events (media tracks only)
    p.on("trackSubscribed", (track) => {
      if (!isMediaTrack(track)) return; // ignore data tracks
      const el = track.attach();
      container.appendChild(el);
    });
    p.on("trackUnsubscribed", (track) => {
      if (!isMediaTrack(track)) return;
      track.detach().forEach((el) => el.remove());
    });
  };

  const detachAll = (containerId: string) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll("video, audio").forEach((el) => el.remove());
  };

  const updateParticipants = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;
    const arr = [
      room.localParticipant,
      ...Array.from(room.participants.values()),
    ];
    setParticipants(
      arr.map((p) => ({
        id: (p as any).sid ?? p.identity ?? "participant",
        name: p.identity || "Participant",
        micOn: true, // You can compute from publications if you want true mute state.
        videoOn: true,
      }))
    );
  }, []);

  const join = useCallback(async () => {
    const url =
      kind === "appointment"
        ? `${apiBase}/video/${appointmentId}/join-token`
        : `${apiBase}/video-rooms/${roomId}/join`;

    const r = await fetch(url, { credentials: "include" });
    if (!r.ok) throw new Error(`join-token failed: ${r.status}`);
    const data = await r.json();
    if (data.provider !== "twilio") {
      throw new Error(
        "Server returned non-twilio provider while client expects twilio"
      );
    }

    const tracks = await createLocalTracks({
      audio: true,
      video: { width: 1280 },
    });
    const room = await connect(data.token, { name: data.roomName, tracks });
    roomRef.current = room;

    // Attach local media tracks
    const localDiv = document.getElementById(localContainerId);
    if (localDiv) {
      room.localParticipant.tracks.forEach((pub: LocalTrackPublication) => {
        const t = pub.track;
        if (t && isLocalMediaTrack(t)) {
          const el = t.attach();
          localDiv.appendChild(el);
        }
      });
    }

    // Existing remote participants
    room.participants.forEach((rp) => appendParticipant(rp, remoteContainerId));

    // Joins/leaves
    room.on("participantConnected", (rp: RemoteParticipant) => {
      appendParticipant(rp, remoteContainerId);
      updateParticipants();
    });

    room.on("participantDisconnected", (rp: RemoteParticipant) => {
      rp.tracks.forEach((pub) => {
        if (pub.track && isMediaTrack(pub.track)) {
          pub.track.detach().forEach((el) => el.remove());
        }
      });
      updateParticipants();
    });

    room.on("disconnected", () => {
      detachAll(remoteContainerId);
      detachAll(localContainerId);
    });

    updateParticipants();

    // Socket (chat/presence)
    const socket = io(apiBase.replace(/\/api$/, ""), {
      withCredentials: true,
      transports: ["websocket"],
      auth:
        kind === "appointment"
          ? { userId, role, appointmentId }
          : { userId, role, roomId },
    });
    socket.on("chat:message", (msg: { sender: string; text: string }) => {
      setMessages((m) => [...m, msg]);
    });
    socketRef.current = socket;
  }, [apiBase, appointmentId, roomId, kind, role, userId, updateParticipants]);

  const leave = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;

    const room = roomRef.current;
    if (room) {
      room.disconnect();
      roomRef.current = null;
    }

    setParticipants([]);
    setMessages([]);
    detachAll(remoteContainerId);
    detachAll(localContainerId);
  }, []);

  const toggleAudio = useCallback(async (on: boolean) => {
    const room = roomRef.current;
    if (!room) return;
    room.localParticipant.audioTracks.forEach((pub) => {
      const t = pub.track;
      if (t && "enable" in t && typeof (t as any).enable === "function") {
        on ? (t as any).enable() : (t as any).disable();
      }
    });
    setMicOn(on);
  }, []);

  const toggleVideo = useCallback(async (on: boolean) => {
    const room = roomRef.current;
    if (!room) return;
    room.localParticipant.videoTracks.forEach((pub) => {
      const t = pub.track;
      if (t && "enable" in t && typeof (t as any).enable === "function") {
        on ? (t as any).enable() : (t as any).disable();
      }
    });
    setVideoOn(on);
  }, []);

  const startScreenShare = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;

    // Browser API typing is inconsistent; cast is normal here.
    const displayStream = (await (
      navigator.mediaDevices as any
    ).getDisplayMedia({ video: true })) as MediaStream;
    const screenTrack = displayStream.getVideoTracks()[0];
    if (!screenTrack) return;

    // Publish as a proper LocalVideoTrack (no ts-ignore needed)
    const screenLocalTrack = new LocalVideoTrack(screenTrack);
    const pub = await room.localParticipant.publishTrack(screenLocalTrack);

    setScreenSharing(true);

    screenTrack.onended = () => {
      try {
        pub.unpublish();
      } finally {
        setScreenSharing(false);
      }
    };
  }, []);

  const stopScreenShare = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;

    room.localParticipant.videoTracks.forEach((pub) => {
      const t = pub.track;
      // Best-effort heuristic to find the screen track
      const label = (t as any)?.mediaStreamTrack?.label as string | undefined;
      if (label && label.toLowerCase().includes("screen")) {
        pub.unpublish();
      }
    });
    setScreenSharing(false);
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
      remoteStreams: [] as any[], // Twilio manages DOM directly
      localStream: null as MediaStream | null,
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
