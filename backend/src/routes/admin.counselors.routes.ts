import { Router } from "express";
import {
  createCounselor,
  updateCounselor,
  deleteCounselor,
  toggleCounselorActive,
  listCounselors,
  getCounselor,
} from "../controllers/adminCounselors.controller";
import { requireAuth, requireRole } from "../middleware/requireAuth";

const router = Router();
router.use(requireAuth);
router.use(requireRole(["admin", "student"]));

router.get("/counselors", listCounselors);
router.get("/counselors/:id", getCounselor);
router.post("/counselors", createCounselor);
router.patch("/counselors/:id", updateCounselor);
router.patch("/counselors/:id/active", toggleCounselorActive);
router.delete("/counselors/:id", deleteCounselor);

export default router;
