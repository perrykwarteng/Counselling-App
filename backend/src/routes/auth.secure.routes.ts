import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { changePassword } from "../controllers/auth.changePassword.controller";

const authSecureRouter = Router();

authSecureRouter.use(requireAuth);
authSecureRouter.post("/change-password", changePassword);

export default authSecureRouter;
