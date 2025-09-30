import { Router } from "express";
import {asyncHandler} from "../utils/asyncHandler";
import { requireAuth, requireRole } from "../middleware/requireAuth"
import { createFeedback } from "../controllers/feedback.controller";
import { feedbackRules } from "../middleware/validators";

const router = Router();
router.post(
  "/",
  requireAuth,
  requireRole(["student"]),
  feedbackRules as any,
  asyncHandler(createFeedback)
);
export default router;
