import { Request, Response } from "express";
import { User } from "../models/user.model";
import { OtpToken } from "../models/otpToken.model";
import { isEmail } from "../utils/validate";

function pick<T extends object>(obj: T, keys: (keyof T)[]) {
  const out: Partial<T> = {};
  for (const k of keys) {
    if (k in obj && (obj as any)[k] !== undefined)
      (out as any)[k] = (obj as any)[k];
  }
  return out;
}

export async function listStudents(req: Request, res: Response) {
  try {
    const { q = "", active } = req.query as {
      q?: string;
      active?: "true" | "false";
    };

    const filter: any = { role: "student" };

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { "profile.department": { $regex: q, $options: "i" } },
        { "profile.level": { $regex: q, $options: "i" } },
      ];
    }

    if (active === "true" || active === "false") {
      filter.is_active = active === "true";
    }

    const items = await User.find(filter)
      .sort({ created_at: -1 })
      .select(
        "_id name email phone avatar_url profile.department profile.level is_verified is_active is_anonymous created_at updated_at"
      )
      .lean();

    return res.json(items);
  } catch (err) {
    return res.status(500).json({ error: "Failed to list students" });
  }
}

export async function getStudent(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const student = await User.findOne({ _id: id, role: "student" })
      .select(
        "_id name email phone avatar_url profile.department profile.level is_verified is_active is_anonymous created_at updated_at"
      )
      .lean();

    if (!student) return res.status(404).json({ error: "Student not found" });

    return res.json({ student });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch student" });
  }
}

export async function updateStudent(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const raw = pick(req.body ?? {}, [
      "name",
      "email",
      "phone",
      "avatar_url",
      "profile",
    ]) as {
      name?: string;
      email?: string;
      phone?: string;
      avatar_url?: string;
      profile?: { department?: string; level?: string };
    };

    if (raw.email && !isEmail(raw.email)) {
      return res.status(400).json({ error: "Invalid email" });
    }

    if (raw.email) {
      const clash = await User.findOne({
        email: raw.email,
        _id: { $ne: id },
      }).lean();
      if (clash) return res.status(409).json({ error: "Email already in use" });
    }

    const $set: Record<string, any> = { updated_at: new Date() };
    if (typeof raw.name !== "undefined") $set["name"] = raw.name;
    if (typeof raw.email !== "undefined") $set["email"] = raw.email;
    if (typeof raw.phone !== "undefined") $set["phone"] = raw.phone;
    if (typeof raw.avatar_url !== "undefined")
      $set["avatar_url"] = raw.avatar_url;

    if (raw.profile) {
      if (typeof raw.profile.department !== "undefined")
        $set["profile.department"] = raw.profile.department;
      if (typeof raw.profile.level !== "undefined")
        $set["profile.level"] = raw.profile.level;
    }

    const user = await User.findOneAndUpdate(
      { _id: id, role: "student" },
      { $set },
      { new: true }
    ).select(
      "_id name email phone avatar_url profile.department profile.level is_verified is_active is_anonymous created_at updated_at"
    );

    if (!user) return res.status(404).json({ error: "Student not found" });

    return res.json({ message: "Student updated", student: user });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update student" });
  }
}

export async function toggleStudentActive(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { is_active } = req.body as { is_active: boolean };

    if (typeof is_active !== "boolean") {
      return res.status(400).json({ error: "is_active must be boolean" });
    }

    const user = await User.findOneAndUpdate(
      { _id: id, role: "student" },
      { $set: { is_active, updated_at: new Date() } },
      { new: true }
    ).select(
      "_id name email phone avatar_url profile.department profile.level is_verified is_active is_anonymous created_at updated_at"
    );

    if (!user) return res.status(404).json({ error: "Student not found" });

    return res.json({
      message: is_active ? "Student activated" : "Student deactivated",
      student: user,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to toggle student active" });
  }
}

export async function deleteStudent(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const user = await User.findOne({ _id: id, role: "student" }).lean();
    if (!user) return res.status(404).json({ error: "Student not found" });

    await Promise.all([
      User.deleteOne({ _id: id }),
      OtpToken.deleteMany({ user_id: id }),
    ]);

    return res.json({ message: "Student deleted" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete student" });
  }
}
