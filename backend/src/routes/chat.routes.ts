import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middleware/requireAuth";
import { listMessages, sendMessage } from "../controllers/chat.controller";
import { sendMessageRules } from "../middleware/validators";

const router = Router();
router.get("/:appointmentId", requireAuth, asyncHandler(listMessages));
router.post(
  "/:appointmentId",
  requireAuth,
  sendMessageRules as any,
  asyncHandler(sendMessage)
);
export default router;
