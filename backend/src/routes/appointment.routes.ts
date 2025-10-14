import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, requireRole } from "../middleware/requireAuth";
import {
  createAppointment,
  getAppointment,
  listMyAppointments,
  updateAppointment,
} from "../controllers/appointment.controller";
import {
  createApptRules,
  updateApptStatusRules,
} from "../middleware/validators";

const router = Router();
router.post(
  "/appointments",
  requireAuth,
  requireRole(["student"]),
  createApptRules as any,
  asyncHandler(createAppointment)
);
router.patch(
  "/appointments/:id/status",
  requireAuth,
  requireRole(["counselor", "admin"]),
  updateApptStatusRules as any,
  asyncHandler(updateAppointment)
);
router.get("/appointments", requireAuth, asyncHandler(listMyAppointments));
router.get("/appointments/:id", requireAuth, asyncHandler(getAppointment));
export default router;
