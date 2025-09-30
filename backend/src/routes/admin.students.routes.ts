import { Router } from "express";
import {} from "../controllers/adminCounselors.controller";
import { requireAuth, requireRole } from "../middleware/requireAuth";
import {
  listStudents,
  getStudent,
  updateStudent,
  toggleStudentActive,
  deleteStudent,
} from "../controllers/adminStudents.controller";

const router = Router();
router.use(requireAuth);
router.use(requireRole(["admin"]));

router.get("/students", listStudents);
router.get("/students/:id", getStudent);
router.patch("/students/:id", updateStudent);
router.patch("/students/:id/active", toggleStudentActive);
router.delete("/students/:id", deleteStudent);

export default router;
