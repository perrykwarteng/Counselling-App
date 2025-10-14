// routes/user.ts
import { Router } from "express";
import { getMe, patchMe } from "../controllers/profile.controller";
import { changePassword } from "../controllers/auth.changePassword.controller";
import { requireAuth } from "../middleware/requireAuth";
import { deleteAccount } from "../controllers/auth.changePassword.controller";

const router = Router();


router.get("/users/me", requireAuth, getMe);
router.patch("/users/me", requireAuth, patchMe);

router.post("/user/change-password", requireAuth, changePassword);

router.delete("/user/delete-account", requireAuth, deleteAccount);

export default router;
