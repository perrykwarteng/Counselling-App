import type { Request, Response } from "express";
import { User, type Role } from "../models/user.model";
import { serializeUserForSelf } from "../utils/serializeUser";

// Fields counselors can edit (students ignored)
const COUNSELOR_FIELDS = new Set([
  "counselor_type",
  "availability",
  "specialities",
]);
// Never allow these via PATCH
const FORBIDDEN_FIELDS = new Set([
  "role",
  "is_active",
  "is_verified",
  "password_hash",
  "_id",
  "email", // email changes not allowed here
  "created_at",
  "updated_at",
]);

interface ProfilePatch {
  department?: string | null;
  level?: string | null;
}

/** GET /users/me */
export async function getMe(req: Request, res: Response) {
  try {
    const userId = req.user?.sub; // <— use sub (set by requireAuth)
    const role = req.user?.role as Role | undefined;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const doc = await User.findById(userId).lean();
    if (!doc) return res.status(404).json({ message: "Not found" });

    const payload = serializeUserForSelf(doc, role as Role);
    return res.json(payload); // or { user: payload } if your client expects that
  } catch (e: any) {
    return res
      .status(500)
      .json({ message: e?.message || "Failed to load profile" });
  }
}

/** PATCH /users/me */
export async function patchMe(req: Request, res: Response) {
  try {
    const userId = req.user?.sub; // <— use sub
    const role = req.user?.role as Role | undefined;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const me = await User.findById(userId);
    if (!me) return res.status(404).json({ message: "Not found" });

    const body = req.body ?? {};
    const isCounselor = me.role === "counselor";

    const patch: Record<string, any> = {};

    for (const [key, value] of Object.entries(body)) {
      if (FORBIDDEN_FIELDS.has(key)) continue;
      if (COUNSELOR_FIELDS.has(key) && !isCounselor) continue;

      switch (key) {
        case "name": {
          const v = String(value ?? "").trim();
          if (v.length) patch.name = v;
          break;
        }
        case "phone": {
          // allow clearing by null, ignore undefined
          if (value === null) patch.phone = null;
          else if (typeof value !== "undefined")
            patch.phone = String(value).trim();
          break;
        }
        case "is_anonymous": {
          if (typeof value !== "undefined") patch.is_anonymous = Boolean(value);
          break;
        }
        case "avatar_url": {
          if (value === null) patch.avatar_url = null;
          else if (typeof value !== "undefined")
            patch.avatar_url = String(value);
          break;
        }
        case "profile": {
          if (value && typeof value === "object") {
            const p = value as ProfilePatch;
            if (typeof p.department !== "undefined") {
              patch["profile.department"] = p.department; // allow null
            }
            if (typeof p.level !== "undefined") {
              patch["profile.level"] = p.level; // allow null
            }
          }
          break;
        }
        case "counselor_type": {
          if (isCounselor) {
            patch.counselor_type = value === null ? null : String(value);
          }
          break;
        }
        case "availability": {
          if (isCounselor) {
            if (value === null) patch.availability = [];
            else if (Array.isArray(value))
              patch.availability = value.map(String);
          }
          break;
        }
        case "specialities": {
          if (isCounselor) {
            if (value === null) patch.specialities = [];
            else if (Array.isArray(value))
              patch.specialities = value.map(String);
          }
          break;
        }
        default:
          // ignore unknown keys silently
          break;
      }
    }

    if (Object.keys(patch).length === 0) {
      const payload = serializeUserForSelf(me.toObject(), role as Role);
      return res.json(payload); // or { user: payload, message: "No changes" }
    }

    (patch as any).updated_at = new Date();
    await User.updateOne({ _id: userId }, { $set: patch });

    const updated = await User.findById(userId).lean();
    const payload = serializeUserForSelf(updated!, role as Role);
    return res.json(payload); 
  } catch (e: any) {
    return res
      .status(500)
      .json({ message: e?.message || "Failed to update profile" });
  }
}
