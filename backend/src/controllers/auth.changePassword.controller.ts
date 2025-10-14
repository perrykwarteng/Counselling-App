import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/user.model";

export async function changePassword(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { current_password, new_password } = req.body || {};
    if (typeof current_password !== "string" || !current_password) {
      return res.status(400).json({ message: "Current password is required" });
    }
    if (typeof new_password !== "string" || new_password.length < 8) {
      return res
        .status(400)
        .json({ message: "New password must be at least 8 characters" });
    }

    // Load user with password_hash (ensure selectable in schema if hidden)
    const me = await User.findById(userId).select("+password_hash");
    if (!me) return res.status(404).json({ message: "User not found" });

    const valid = await bcrypt.compare(current_password, me.password_hash);
    if (!valid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // optional: block reusing same password
    const sameAsOld = await bcrypt.compare(new_password, me.password_hash);
    if (sameAsOld) {
      return res
        .status(400)
        .json({ message: "New password must be different from old one" });
    }

    me.password_hash = await bcrypt.hash(new_password, 10);
    (me as any).updated_at = new Date();
    await me.save();

    return res.json({ ok: true, message: "Password updated" });
  } catch (e: any) {
    return res
      .status(500)
      .json({ message: e?.message || "Failed to change password" });
  }
}

export async function deleteAccount(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    await User.findByIdAndDelete(userId);
    return res.json({ ok: true });
  } catch (e: any) {
    return res
      .status(500)
      .json({ message: e?.message || "Failed to delete account" });
  }
}
