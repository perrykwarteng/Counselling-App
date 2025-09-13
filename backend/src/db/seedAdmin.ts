import bcrypt from "bcryptjs";
import { User } from "../models/user.model";
import { env } from "../config";

export async function seedAdmin() {
  const email = env.ADMIN_EMAIL;
  const password = env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("[seedAdmin] Skipped: ADMIN_EMAIL/ADMIN_PASSWORD not set");
    return;
  }
  const existing = await User.findOne({ email });
  const password_hash = await bcrypt.hash(password, 12);
  if (!existing) {
    await User.create({
      name: "System Admin",
      email,
      password_hash,
      role: "admin",
      is_verified: true,
    });
    console.log("[seedAdmin] Admin created");
  } else {
    existing.role = "admin";
    existing.is_verified = true;
    existing.password_hash = password_hash;
    await existing.save();
    console.log("[seedAdmin] Admin ensured/updated");
  }
}
