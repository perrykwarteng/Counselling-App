import { Router } from "express";
import multer from "multer";
import path from "path";
import {
  listResources,
  getResource,
  createResource,
  updateResource,
  deleteResource,
  uploadResourceFile,
} from "../controllers/adminResource.controller";
import { requireAuth, requireRole } from "../middleware/requireAuth";

const router = Router();
router.use(requireAuth);
router.use(requireRole(["admin"]));

import fs from "fs";
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  },
});

// optional: mimes/size guard
const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const ok =
    /^(application\/pdf|image\/(png|jpeg|jpg|gif)|video\/(mp4|quicktime)|audio\/(mpeg|mp3|wav|aac))$/.test(
      file.mimetype
    );
  if (!ok) return cb(new Error("Unsupported file type"));
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
});

router.get("/resources", listResources);
router.get("/resources/:id", getResource);
router.post("/resources", createResource);
router.patch("/resources/:id", updateResource);
router.delete("/resources/:id", deleteResource);
router.post("/upload", upload.single("file"), uploadResourceFile);

export default router;
