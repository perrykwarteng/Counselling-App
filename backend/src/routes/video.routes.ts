import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middleware/requireAuth";
import { getJoinToken } from "../controllers/video.controller";

const router = Router();
router.get("/:appointmentId/token", requireAuth, asyncHandler(getJoinToken));
export default router;
