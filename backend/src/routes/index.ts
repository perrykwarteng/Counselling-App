import { Router } from "express";
import authRoutes from "./auth.routes";
import profileRoutes from "./profile.routes";

const router = Router();
router.use('/api/auth', authRoutes);
router.use('/api/profile', profileRoutes);
export default router;
