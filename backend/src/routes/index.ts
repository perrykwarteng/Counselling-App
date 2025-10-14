import { Router } from "express";
import authRoutes from "./auth.routes";
import chatRoutes from "./chat.routes";
import videoRoutes from "./video.routes";
import apptRoutes from "./appointment.routes";
import fbRoutes from "./feedback.routes";
import adminCounselor from "./admin.counselors.routes";
import adminStudent from "./admin.students.routes";
import adminResource from "./admin.resource.route";
import adminReferrals from "./admin.referrals.route";
import adminLogsRouter from "./admin.log.route";
import resources from "./resources.public.route";
import UserRoute from "./users.me.routes";

const router = Router();

router.use("/api/auth", authRoutes);
router.use("/api/resources", resources);

router.use("/api/user", UserRoute);

router.use("/api/appointments", apptRoutes);
router.use("/api/chat", chatRoutes);
router.use("/api/video", videoRoutes);
router.use("/api/feedback", fbRoutes);

router.use("/api/admin/counselor", adminCounselor);
router.use("/api/admin/student", adminStudent);
router.use("/api/admin/resources", adminResource);
router.use("/api/admin/referrals", adminReferrals);
router.use("/api/admin/logs", adminLogsRouter);

export default router;
