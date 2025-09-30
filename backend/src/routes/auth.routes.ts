import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import {
  register,
  verifyOtp,
  login,
  logout,
  forgotPassword,
  resetPassword,
  refreshToken,
  me,
} from "../controllers/auth.controller";

const router = Router();
router.post("/register", asyncHandler(register));
router.post("/verify-otp", asyncHandler(verifyOtp));
router.post("/login", asyncHandler(login));
router.post("/logout", asyncHandler(logout));
router.post("/forgot-password", asyncHandler(forgotPassword));
router.post("/reset-password", asyncHandler(resetPassword));
router.post("/refresh", asyncHandler(refreshToken));
router.get("/me", asyncHandler(me));
export default router;
