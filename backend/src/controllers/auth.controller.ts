import bcrypt from "bcryptjs";
import dayjs from "dayjs";
import { Request, Response } from "express";
import { User } from "../models/user.model";
import { OtpToken } from "../models/otpToken.model";
import { generateNumericOTP, hashOTP, matchOTP } from "../lib/otp";
import { signAccess, signRefresh, type JwtPayload } from "../lib/jwt";
import {
  isEmail,
  isNonEmptyString,
  hasMin,
  isUuid,
  isOtp,
  requireFields,
} from "../utils/validate";
import { sendOTP, sendPasswordReset, sendWelcomeEmail } from "../lib/emails";

export const register = async (req: Request, res: Response) => {
  const err = requireFields(req.body, ["name", "email", "password"]);
  if (err) return res.status(400).json({ error: err });
  const { name, email, phone, password } = req.body;
  if (!isNonEmptyString(name))
    return res.status(400).json({ error: "Invalid name" });
  if (!isEmail(email)) return res.status(400).json({ error: "Invalid email" });
  if (!hasMin(password, 8))
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });

  const exists = await User.findOne({ $or: [{ email }, { phone }] });
  if (exists)
    return res.status(409).json({ error: "Email or phone already in use" });

  const password_hash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
    phone,
    password_hash,
    role: "student",
  });

  const code = generateNumericOTP(6);
  const otp_hash = await hashOTP(code);
  await OtpToken.create({
    user_id: user._id,
    otp_hash,
    expires_at: dayjs().add(10, "minute").toDate(),
  });

  //send OTP via Gmail
  await sendOTP(email, code);

  return res.status(201).json({
    message: "Registered. Verify OTP sent to email.",
    user_id: user._id,
  });
};

export const verifyOtp = async (req: Request, res: Response) => {
  const err = requireFields(req.body, ["user_id", "code"]);
  if (err) return res.status(400).json({ error: err });

  const { user_id, code } = req.body as { user_id: string; code: string };
  if (!isUuid(user_id))
    return res.status(400).json({ error: "Invalid user_id" });
  if (!isOtp(code)) return res.status(400).json({ error: "Invalid code" });

  const token = await OtpToken.findOne({ user_id, verified: false }).sort({
    created_at: -1,
  });
  if (!token)
    return res.status(400).json({ error: "No active OTP. Request a new one." });
  if (dayjs(token.expires_at).isBefore(dayjs()))
    return res.status(400).json({ error: "OTP expired" });

  const ok = await matchOTP(code, token.otp_hash);
  if (!ok) return res.status(400).json({ error: "Invalid OTP" });

  await Promise.all([
    User.updateOne({ _id: user_id }, { $set: { is_verified: true } }),
    OtpToken.updateOne({ _id: token._id }, { $set: { verified: true } }),
  ]);

  const user = await User.findById(user_id, { email: 1, name: 1, role: 1 });

  const role = (user?.role ?? "student") as JwtPayload["role"];
  const access = signAccess({ sub: String(user_id), role });
  const refresh = signRefresh({ sub: String(user_id), role });

  res.cookie("access_token", access, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 30 * 60 * 1000,
  });
  res.cookie("refresh_token", refresh, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  if (user?.email) {
    await sendWelcomeEmail(user.email, user?.name ?? "User");
  }

  return res.json({
    message: "Account verified",
    access_token: access,
    refresh_token: refresh,
  });
};

export const login = async (req: Request, res: Response) => {
  const err = requireFields(req.body, ["email", "password"]);
  if (err) return res.status(400).json({ error: err });
  const { email, password } = req.body;
  if (!isEmail(email) || !hasMin(password, 8))
    return res.status(400).json({ error: "Invalid credentials" });

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  if (!user.is_verified)
    return res.status(403).json({ error: "Account not verified" });

  const access = signAccess({
    sub: String(user._id),
    role: user.role as JwtPayload["role"],
  });
  const refresh = signRefresh({
    sub: String(user._id),
    role: user.role as JwtPayload["role"],
  });
  res.cookie("access_token", access, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 30 * 60 * 1000,
  });
  res.cookie("refresh_token", refresh, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return res.json({
    message: "Logged in",
    access_token: access,
    refresh_token: refresh,
  });
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies["refresh_token"];
    if (!token) return res.status(401).json({ error: "No refresh token" });

    const payload = verifyRefresh(token) as JwtPayload;
    if (!payload)
      return res.status(403).json({ error: "Invalid refresh token" });

    const user = await User.findById(payload.sub, { role: 1 });
    if (!user) return res.status(403).json({ error: "User not found" });

    const access = signAccess({
      sub: String(user._id),
      role: user.role as JwtPayload["role"],
    });

    res.cookie("access_token", access, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 15 * 60 * 1000,
    });

    return res.json({ access_token: access });
  } catch (err) {
    return res.status(500).json({ error: "Failed to refresh token" });
  }
};

export const logout = async (_req: Request, res: Response) => {
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
  return res.json({ message: "Logged out" });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const err = requireFields(req.body, ["email"]);
  if (err) return res.status(400).json({ error: err });
  const { email } = req.body;
  if (!isEmail(email)) return res.status(400).json({ error: "Invalid email" });

  const user = await User.findOne({ email });
  if (!user)
    return res.json({ message: "If the email exists, an OTP has been sent." });

  const code = generateNumericOTP(6);
  const otp_hash = await hashOTP(code);
  await OtpToken.create({
    user_id: user._id,
    otp_hash,
    expires_at: dayjs().add(10, "minute").toDate(),
  });

  // Send OTP via Gmail
  await sendOTP(email, code);

  return res.json({ message: "If the email exists, an OTP has been sent." });
};

export const resetPassword = async (req: Request, res: Response) => {
  const err = requireFields(req.body, ["email", "code", "new_password"]);
  if (err) return res.status(400).json({ error: err });
  const { email, code, new_password } = req.body as {
    email: string;
    code: string;
    new_password: string;
  };
  if (!isEmail(email)) return res.status(400).json({ error: "Invalid email" });
  if (!isOtp(code)) return res.status(400).json({ error: "Invalid code" });
  if (!hasMin(new_password, 8))
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "Invalid OTP or email" });

  const token = await OtpToken.findOne({
    user_id: user._id,
    verified: false,
  }).sort({ created_at: -1 });
  if (!token) return res.status(400).json({ error: "Invalid or expired OTP" });
  if (dayjs(token.expires_at).isBefore(dayjs()))
    return res.status(400).json({ error: "Invalid or expired OTP" });

  const ok = await matchOTP(code, token.otp_hash);
  if (!ok) return res.status(400).json({ error: "Invalid or expired OTP" });

  const password_hash = await bcrypt.hash(new_password, 12);
  await Promise.all([
    User.updateOne({ _id: user._id }, { $set: { password_hash } }),
    OtpToken.updateOne({ _id: token._id }, { $set: { verified: true } }),
  ]);

  // Confirm via Gmail
  await sendPasswordReset(email, "http://localhost:3000/auth/resetPassword");
  return res.json({ message: "Password reset successful" });
};

function verifyRefresh(token: any): JwtPayload {
  throw new Error("Function not implemented.");
}
