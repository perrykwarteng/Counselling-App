// types/video.ts
export type Participant = {
  id: string;
  name: string;
  micOn: boolean;
  videoOn: boolean;
};

export type RemoteStream = {
  id: string;
  name: string;
  stream: MediaStream;
};

export type VideoState = {
  micOn: boolean;
  videoOn: boolean;
  messages: { sender: string; text: string }[];
  participants: Participant[];
  remoteStreams: RemoteStream[];
  localStream: MediaStream | null;
};

export type VideoCtx = {
  state: VideoState;
  provider: "native" | "twilio";
  join: () => Promise<void>;
  leave: () => void;
  toggleAudio: (on: boolean) => void;
  toggleVideo: (on: boolean) => void;
  startScreenShare: () => void;
  sendChat: (msg: { text: string }) => void;
};
