import { Router } from "express";
import {
  listReferredStudents,
  listReferredCounselors,
  listUnassignedStudents,
  createReferral,
  getReferralHistoryByStudent,
} from "../controllers/adminReferrals.controller";
import { requireAuth, requireRole } from "../middleware/requireAuth";

const router = Router();

router.get(
  "/students",
  [requireAuth, requireRole(["admin", "counselor"])],
  listReferredStudents
);

router.get(
  "/counselors",
  [requireAuth, requireRole(["admin", "counselor"])],
  listReferredCounselors
);

router.get(
  "/unassigned-students",
  [requireAuth, requireRole(["admin", "counselor"])],
  listUnassignedStudents
);

router.post(
  "/refer-student",
  [requireAuth, requireRole(["admin", "counselor"])],
  createReferral
);

router.get(
  "/referral-history/:studentId",
  [requireAuth, requireRole(["admin", "counselor"])],
  getReferralHistoryByStudent
);

export default router;
