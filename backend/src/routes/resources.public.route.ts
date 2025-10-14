import { Router } from "express";
import {
  listPublicResources,
  getPublicResource,
} from "../controllers/resource.controller";

const router = Router();

router.get("/resources", listPublicResources);
router.get("/resources/:id", getPublicResource);

export default router;
