// src/routes/adminLogs.routes.ts
import { Router } from "express";
import {
  listAdminLogs,
  getAdminLogById,
  exportAdminLogs,
  listAdminLogModules,
} from "../controllers/adminLogs.controller";
import { requireAuth, requireRole } from "../middleware/requireAuth";

const router = Router();
router.use(requireAuth);
router.use(requireRole(["admin"]));

router.get("/logs", listAdminLogs);
router.get("/modules", listAdminLogModules);
router.get("/export", exportAdminLogs);
router.get("/:id", getAdminLogById);

export default router;
