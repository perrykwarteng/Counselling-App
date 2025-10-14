import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { getJoinToken } from "../controllers/video.controller";
import {
  createVideoRoom,
  joinVideoRoom,
  endVideoRoom,
} from "../controllers/videoRoom.controller";

const router = Router();

// scheduled appointments
// final path: /api/video/:appointmentId/join-token
router.get("/video/:appointmentId/join-token", requireAuth, getJoinToken);

// ad-hoc rooms
router.post("/video-rooms", requireAuth, createVideoRoom);
router.post("/video-rooms/:roomId/join", requireAuth, joinVideoRoom);
router.post("/video-rooms/:roomId/end", requireAuth, endVideoRoom);

export default router;
