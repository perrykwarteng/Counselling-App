// import { Router } from "express";
// import { requireAuth } from "../middleware/requireAuth";
// import { roleGuard } from "../middleware/roleGuard";
// import { asyncHandler } from "../utils/asyncHandler";
// import {
//   getStudentProfile,
//   updateStudentProfile,
//   getCounselorProfile,
//   updateCounselorProfile,
// } from "../controllers/adminStudents.controller";

// const router = Router();
// router.get(
//   "/student/profile",
//   requireAuth,
//   roleGuard("student", "admin"),
//   asyncHandler(getStudentProfile)
// );
// router.put(
//   "/student/profile",
//   requireAuth,
//   roleGuard("student", "admin"),
//   asyncHandler(updateStudentProfile)
// );
// router.get(
//   "/counselor/profile",
//   requireAuth,
//   roleGuard("counselor", "admin"),
//   asyncHandler(getCounselorProfile)
// );
// router.put(
//   "/counselor/profile",
//   requireAuth,
//   roleGuard("counselor", "admin"),
//   asyncHandler(updateCounselorProfile)
// );
// export default router;
