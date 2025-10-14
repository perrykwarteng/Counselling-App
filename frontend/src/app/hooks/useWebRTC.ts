// import { useEffect, useRef } from "react";
// import { socket } from "../lib/socket";

// export function useWebRTC(
// localVideoRef: unknown, remoteVideoRef: unknown, p0: { sessionId: string; kind: "appointment" | "room"; userId: string; useExistingLocalStream: boolean; }, localVideoRef: React.RefObject<HTMLVideoElement>, remoteVideoRef: React.RefObject<HTMLVideoElement>) {
//   const pcRef = useRef<RTCPeerConnection | null>(null);

//   useEffect(() => {
//     const pc = new RTCPeerConnection({
//       iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//     });
//     pcRef.current = pc;

//     // Attach local stream
//     navigator.mediaDevices
//       .getUserMedia({ video: true, audio: true })
//       .then((stream) => {
//         if (localVideoRef.current) localVideoRef.current.srcObject = stream;
//         stream.getTracks().forEach((track) => pc.addTrack(track, stream));
//       });

//     // Handle remote stream
//     pc.ontrack = (event) => {
//       if (remoteVideoRef.current) {
//         remoteVideoRef.current.srcObject = event.streams[0];
//       }
//     };

//     // Send ICE candidates to server
//     pc.onicecandidate = (event) => {
//       if (event.candidate) {
//         socket.emit("webrtc:ice-candidate", {
//           candidate: event.candidate,
//           appointmentId: "APPOINTMENT_ID",
//           roomId: "ROOM_ID",
//         });
//       }
//     };

//     // Handle incoming offer
//     socket.on("webrtc:offer", async ({ sdp, from }) => {
//       if (!pcRef.current) return;
//       await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
//       const answer = await pcRef.current.createAnswer();
//       await pcRef.current.setLocalDescription(answer);
//       socket.emit("webrtc:answer", {
//         sdp: answer,
//         appointmentId: "APPOINTMENT_ID",
//         roomId: "ROOM_ID",
//       });
//     });

//     // Handle incoming answer
//     socket.on("webrtc:answer", async ({ sdp }) => {
//       if (!pcRef.current) return;
//       await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
//     });

//     // Handle incoming ICE candidates
//     socket.on("webrtc:ice-candidate", async ({ candidate }) => {
//       if (!pcRef.current) return;
//       try {
//         await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
//       } catch (err) {
//         console.error("Error adding ICE candidate", err);
//       }
//     });

//     return () => {
//       socket.off("webrtc:offer");
//       socket.off("webrtc:answer");
//       socket.off("webrtc:ice-candidate");
//       pc.close();
//     };
//   }, [localVideoRef, remoteVideoRef]);

//   // Create & send offer
//   async function call() {
//     if (!pcRef.current) return;
//     const offer = await pcRef.current.createOffer();
//     await pcRef.current.setLocalDescription(offer);
//     socket.emit("webrtc:offer", {
//       sdp: offer,
//       appointmentId: "APPOINTMENT_ID",
//       roomId: "ROOM_ID",
//     });
//   }

//   return { call };
// }
