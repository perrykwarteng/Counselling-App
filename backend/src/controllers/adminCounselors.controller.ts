import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import dayjs from "dayjs";

import { User, type CounselorType } from "../models/user.model";
import { OtpToken } from "../models/otpToken.model";

import { isEmail, isNonEmptyString } from "../utils/validate";
import { generateNumericOTP, hashOTP } from "../lib/otp";
import { sendCounselorOnboarding } from "../lib/emails";

const ALLOWED_TYPES: Exclude<CounselorType, null>[] = [
  "academic",
  "professional",
];

function generateTempPassword(len = 12) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*";
  let out = "";
  for (let i = 0; i < len; i++)
    out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function pick<T extends object>(obj: T, keys: (keyof T)[]) {
  const out: Partial<T> = {};
  for (const k of keys) {
    if (k in obj && (obj as any)[k] !== undefined)
      (out as any)[k] = (obj as any)[k];
  }
  return out;
}

export async function createCounselor(req: Request, res: Response) {
  try {
    const { name, email, phone, counselor_type, is_active } = req.body as {
      name: string;
      email: string;
      phone?: string;
      is_active?: boolean;
      counselor_type: CounselorType;
    };

    if (!isNonEmptyString(name)) {
      return res.status(400).json({ error: "Invalid name" });
    }
    if (!isEmail(email)) {
      return res.status(400).json({ error: "Invalid email" });
    }
    if (!ALLOWED_TYPES.includes(counselor_type as any)) {
      return res.status(400).json({ error: "Invalid counselor_type" });
    }

    const exists = await User.findOne({ email }).lean();
    if (exists) return res.status(409).json({ error: "Email already exists" });

    const tempPassword = generateTempPassword(12);
    const password_hash = await bcrypt.hash(tempPassword, 12);

    const user = await User.create({
      name,
      email,
      phone: phone || undefined,
      password_hash,
      role: "counselor",
      counselor_type,
      availability: [],
      specialities: [],
      is_verified: false,
      is_anonymous: false,
      is_active,
    });

    const otp = generateNumericOTP(6);
    const otp_hash = await hashOTP(otp);
    await OtpToken.create({
      user_id: String(user._id),
      otp_hash,
      expires_at: dayjs().add(30, "minute").toDate(),
    });

    await sendCounselorOnboarding(
      user.email,
      user.name,
      tempPassword,
      otp,
      String(user._id),
      30
    );

    const sanitized = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      counselor_type: user.counselor_type,
      availability: user.availability,
      specialities: user.specialities,
      is_verified: user.is_verified,
      is_active: user.is_active,
      created_at: user.created_at,
    };

    return res
      .status(201)
      .json({ message: "Counselor created", counselor: sanitized });
  } catch (err) {
    console.error("createCounselor error:", err);
    return res.status(500).json({ error: "Failed to create counselor" });
  }
}

export async function updateCounselor(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const updates = pick(req.body ?? {}, [
      "name",
      "email",
      "phone",
      "counselor_type",
      "availability",
      "specialities",
      "avatar_url",
    ]) as {
      name?: string;
      email?: string;
      phone?: string;
      counselor_type?: CounselorType;
      availability?: string[];
      specialities?: string[];
      avatar_url?: string;
    };

    if (updates.email && !isEmail(updates.email)) {
      return res.status(400).json({ error: "Invalid email" });
    }
    if (
      updates.counselor_type !== undefined &&
      updates.counselor_type !== null &&
      !ALLOWED_TYPES.includes(updates.counselor_type as any)
    ) {
      return res.status(400).json({ error: "Invalid counselor_type" });
    }
    if (updates.availability && !Array.isArray(updates.availability)) {
      return res.status(400).json({ error: "availability must be string[]" });
    }

    if (updates.email) {
      const clash = await User.findOne({
        email: updates.email,
        _id: { $ne: id },
      }).lean();
      if (clash) return res.status(409).json({ error: "Email already in use" });
    }

    const user = await User.findOneAndUpdate(
      { _id: id, role: "counselor" },
      { $set: { ...updates, updated_at: new Date() } },
      { new: true }
    ).select(
      "_id name email phone role counselor_type availability avatar_url is_verified is_active created_at updated_at"
    );

    if (!user) return res.status(404).json({ error: "Counselor not found" });

    return res.json({ message: "Counselor updated", counselor: user });
  } catch (err) {
    console.error("updateCounselor error:", err);
    return res.status(500).json({ error: "Failed to update counselor" });
  }
}

export async function toggleCounselorActive(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { is_active } = req.body as { is_active: boolean };

    if (typeof is_active !== "boolean") {
      return res.status(400).json({ error: "is_active must be boolean" });
    }

    const user = await User.findOneAndUpdate(
      { _id: id, role: "counselor" },
      { $set: { is_active, updated_at: new Date() } },
      { new: true }
    ).select("_id name email role counselor_type is_verified is_active");

    if (!user) return res.status(404).json({ error: "Counselor not found" });

    return res.json({
      message: is_active ? "Counselor activated" : "Counselor deactivated",
      counselor: user,
    });
  } catch (err) {
    console.error("toggleCounselorActive error:", err);
    return res.status(500).json({ error: "Failed to toggle counselor active" });
  }
}

export async function deleteCounselor(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const user = await User.findOne({ _id: id, role: "counselor" }).lean();
    if (!user) return res.status(404).json({ error: "Counselor not found" });

    await Promise.all([
      User.deleteOne({ _id: id }),
      OtpToken.deleteMany({ user_id: id }),
    ]);

    return res.json({ message: "Counselor deleted" });
  } catch (err) {
    console.error("deleteCounselor error:", err);
    return res.status(500).json({ error: "Failed to delete counselor" });
  }
}

export async function listCounselors(req: Request, res: Response) {
  try {
    const {
      q = "",
      type,
      active,
    } = req.query as {
      q?: string;
      type?: string;
      active?: "true" | "false";
    };

    const filter: any = { role: "counselor" };

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
      ];
    }

    if (type) filter.counselor_type = type;
    if (active === "true" || active === "false") {
      filter.is_active = active === "true";
    }

    const items = await User.find(filter)
      .sort({ created_at: -1 })
      .select(
        "_id name email phone counselor_type is_verified is_active created_at availability specialities"
      )
      .lean();

    return res.json(items);
  } catch (err) {
    console.error("listCounselors error:", err);
    return res.status(500).json({ error: "Failed to list counselors" });
  }
}

export async function getCounselor(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = await User.findOne({ _id: id, role: "counselor" })
      .select(
        "_id name email phone role counselor_type availability avatar_url is_verified is_active created_at updated_at"
      )
      .lean();
    if (!user) return res.status(404).json({ error: "Counselor not found" });
    return res.json({ counselor: user });
  } catch (err) {
    console.error("getCounselor error:", err);
    return res.status(500).json({ error: "Failed to fetch counselor" });
  }
}
