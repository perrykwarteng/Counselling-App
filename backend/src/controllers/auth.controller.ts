import bcrypt from "bcryptjs";
import dayjs from "dayjs";
import { Request, Response } from "express";
import { User } from "../models/user.model";
import { OtpToken } from "../models/otpToken.model";
import { generateNumericOTP, hashOTP, matchOTP } from "../lib/otp";
import {
  signAccess,
  signRefresh,
  verifyAccess,
  verifyRefresh,
  type JwtPayload,
} from "../lib/jwt";
import {
  isEmail,
  isNonEmptyString,
  hasMin,
  isOtp,
  requireFields,
} from "../utils/validate";
import { sendOTP, sendPasswordReset, sendWelcomeEmail } from "../lib/emails";
import { writeAdminLog } from "./adminLogs.controller";

function reqId(req: Request) {
  return (
    (req as any).request_id ||
    (req.headers["x-request-id"] as string) ||
    undefined
  );
}
function ua(req: Request) {
  return req.get("user-agent") || undefined;
}
function ip(req: Request) {
  return (req.headers["x-forwarded-for"] as string) || req.ip || undefined;
}

// ---------- REGISTER ----------
export const register = async (req: Request, res: Response) => {
  const err = requireFields(req.body, ["name", "email", "password"]);
  if (err) {
    await writeAdminLog({
      level: "warn",
      module: "auth",
      message: "Register: missing required fields",
      user_id: null,
      request_id: reqId(req),
      meta: {
        fields: Object.keys(req.body || {}),
        error: err,
        ip: ip(req),
        ua: ua(req),
      },
    });
    return res.status(400).json({ error: err });
  }

  const { name, email, password } = req.body;
  if (!isNonEmptyString(name)) {
    await writeAdminLog({
      level: "warn",
      module: "auth",
      message: "Register: invalid name",
      user_id: null,
      request_id: reqId(req),
      meta: { email, ip: ip(req), ua: ua(req) },
    });
    return res.status(400).json({ error: "Invalid name" });
  }
  if (!isEmail(email)) {
    await writeAdminLog({
      level: "warn",
      module: "auth",
      message: "Register: invalid email",
      user_id: null,
      request_id: reqId(req),
      meta: { email, ip: ip(req), ua: ua(req) },
    });
    return res.status(400).json({ error: "Invalid email" });
  }
  if (!hasMin(password, 8)) {
    await writeAdminLog({
      level: "warn",
      module: "auth",
      message: "Register: weak password",
      user_id: null,
      request_id: reqId(req),
      meta: { email, ip: ip(req), ua: ua(req) },
    });
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });
  }

  const exists = await User.findOne({ $or: [{ email }] });
  if (exists) {
    await writeAdminLog({
      level: "warn",
      module: "auth",
      message: "Register: email already in use",
      user_id: exists._id,
      request_id: reqId(req),
      meta: { email, ip: ip(req), ua: ua(req) },
    });
    return res.status(409).json({ error: "Email already in use" });
  }

  const password_hash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
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

  await sendOTP(email, code);

  await writeAdminLog({
    level: "audit",
    module: "auth",
    message: "Register: user created and OTP issued",
    user_id: user._id,
    request_id: reqId(req),
    meta: { email, otp_expires_in_min: 10, ip: ip(req), ua: ua(req) },
  });

  return res.status(201).json({
    message: "Registered. Verify OTP sent to email.",
    user_id: user._id,
  });
};

// ---------- VERIFY OTP ----------
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const err = requireFields(req.body, ["user_id", "code"]);
    if (err) {
      await writeAdminLog({
        level: "warn",
        module: "auth",
        message: "Verify OTP: missing required fields",
        user_id: null,
        request_id: reqId(req),
        meta: { error: err, ip: ip(req), ua: ua(req) },
      });
      return res.status(400).json({ error: err });
    }

    const { user_id, code } = req.body as { user_id: string; code: string };

    if (!isNonEmptyString(user_id)) {
      await writeAdminLog({
        level: "warn",
        module: "auth",
        message: "Verify OTP: missing user_id",
        user_id: null,
        request_id: reqId(req),
        meta: { ip: ip(req), ua: ua(req) },
      });
      return res.status(400).json({ error: "Missing user_id" });
    }

    if (!isOtp(code)) {
      await writeAdminLog({
        level: "warn",
        module: "auth",
        message: "Verify OTP: invalid code format",
        user_id: user_id,
        request_id: reqId(req),
        meta: { ip: ip(req), ua: ua(req) },
      });
      return res.status(400).json({ error: "Invalid code format" });
    }

    const token = await OtpToken.findOne({
      user_id: String(user_id),
      verified: false,
    }).sort({ created_at: -1 });

    if (!token) {
      await writeAdminLog({
        level: "warn",
        module: "auth",
        message: "Verify OTP: no active token",
        user_id: user_id,
        request_id: reqId(req),
        meta: { ip: ip(req), ua: ua(req) },
      });
      return res
        .status(400)
        .json({ error: "No active OTP. Request a new one." });
    }

    if (dayjs(token.expires_at).isBefore(dayjs())) {
      await writeAdminLog({
        level: "warn",
        module: "auth",
        message: "Verify OTP: token expired",
        user_id: user_id,
        request_id: reqId(req),
        meta: { expires_at: token.expires_at, ip: ip(req), ua: ua(req) },
      });
      return res.status(400).json({ error: "OTP expired" });
    }

    const ok = await matchOTP(code, token.otp_hash);
    if (!ok) {
      await writeAdminLog({
        level: "warn",
        module: "auth",
        message: "Verify OTP: invalid code",
        user_id: user_id,
        request_id: reqId(req),
        meta: { ip: ip(req), ua: ua(req) },
      });
      return res.status(400).json({ error: "Invalid OTP" });
    }

    await Promise.all([
      User.updateOne(
        { _id: String(user_id) },
        { $set: { is_verified: true, updated_at: new Date() } }
      ),
      OtpToken.updateOne({ _id: token._id }, { $set: { verified: true } }),
      OtpToken.updateMany(
        { user_id: String(user_id), _id: { $ne: token._id }, verified: false },
        { $set: { verified: true } }
      ),
    ]);

    const user = await User.findById(String(user_id)).select(
      "_id name email phone role is_verified is_anonymous"
    );
    if (!user) {
      await writeAdminLog({
        level: "error",
        module: "auth",
        message: "Verify OTP: user not found after verification",
        user_id: user_id,
        request_id: reqId(req),
        meta: { ip: ip(req), ua: ua(req) },
      });
      return res.status(404).json({ error: "User not found" });
    }

    const role = (user.role ?? "student") as JwtPayload["role"];
    const access = signAccess({ sub: String(user._id), role });
    const refresh = signRefresh({ sub: String(user._id), role });

    res.cookie("access_token", access, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 30 * 60 * 1000,
      path: "/",
    });
    res.cookie("refresh_token", refresh, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/auth",
    });

    if (user.email) {
      sendWelcomeEmail(user.email, user.name ?? "User").catch(() => {});
    }

    await writeAdminLog({
      level: "audit",
      module: "auth",
      message: "Verify OTP: success, tokens issued",
      user_id: user._id,
      request_id: reqId(req),
      meta: { email: user.email, role: user.role, ip: ip(req), ua: ua(req) },
    });

    return res.json({
      message: "Account verified",
      access_token: access,
      refresh_token: refresh,
      user,
    });
  } catch (error) {
    await writeAdminLog({
      level: "error",
      module: "auth",
      message: "Verify OTP: server error",
      user_id: null,
      request_id: reqId(req),
      meta: {
        error: String((error as any)?.message || error),
        ip: ip(req),
        ua: ua(req),
      },
    });
    console.error("verifyOtp error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// ---------- LOGIN ----------
export const login = async (req: Request, res: Response) => {
  const err = requireFields(req.body, ["email", "password"]);
  if (err) {
    await writeAdminLog({
      level: "warn",
      module: "auth",
      message: "Login: missing required fields",
      user_id: null,
      request_id: reqId(req),
      meta: { error: err, ip: ip(req), ua: ua(req) },
    });
    return res.status(400).json({ error: err });
  }

  const { email, password } = req.body;
  if (!isEmail(email) || !hasMin(password, 8)) {
    await writeAdminLog({
      level: "warn",
      module: "auth",
      message: "Login: invalid credentials format",
      user_id: null,
      request_id: reqId(req),
      meta: { email, ip: ip(req), ua: ua(req) },
    });
    return res.status(400).json({ error: "Invalid credentials" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    await writeAdminLog({
      level: "warn",
      module: "auth",
      message: "Login: user not found",
      user_id: null,
      request_id: reqId(req),
      meta: { email, ip: ip(req), ua: ua(req) },
    });
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    await writeAdminLog({
      level: "warn",
      module: "auth",
      message: "Login: wrong password",
      user_id: user._id,
      request_id: reqId(req),
      meta: { email, ip: ip(req), ua: ua(req) },
    });
    return res.status(401).json({ error: "Invalid credentials" });
  }

  if (!user.is_verified) {
    await writeAdminLog({
      level: "warn",
      module: "auth",
      message: "Login: account not verified",
      user_id: user._id,
      request_id: reqId(req),
      meta: { email, ip: ip(req), ua: ua(req) },
    });
    return res.status(403).json({ error: "Account not verified" });
  }

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
    maxAge: 20 * 24 * 60 * 60 * 1000,
    path: "/",
  });
  res.cookie("refresh_token", refresh, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/auth",
  });

  await writeAdminLog({
    level: "audit",
    module: "auth",
    message: "Login: success",
    user_id: user._id,
    request_id: reqId(req),
    meta: { email: user.email, role: user.role, ip: ip(req), ua: ua(req) },
  });

  return res.json({
    message: "Logged in",
    access_token: access,
    refresh_token: refresh,
  });
};

// ---------- ME ----------
export const me = async (req: Request, res: Response) => {
  try {
    let token = req.cookies?.["access_token"] as string | undefined;

    if (!token) {
      const auth = req.get("authorization") || req.get("Authorization") || "";
      if (auth.startsWith("Bearer ")) token = auth.slice(7).trim();
    }

    if (!token) {
      await writeAdminLog({
        level: "warn",
        module: "auth",
        message: "ME: missing access token",
        user_id: null,
        request_id: reqId(req),
        meta: { ip: ip(req), ua: ua(req) },
      });
      return res.status(401).json({ error: "No access token provided" });
    }

    const payload = verifyAccess(token);
    if (!payload) {
      await writeAdminLog({
        level: "warn",
        module: "auth",
        message: "ME: invalid/expired access token",
        user_id: null,
        request_id: reqId(req),
        meta: { ip: ip(req), ua: ua(req) },
      });
      return res.status(403).json({ error: "Invalid or expired access token" });
    }

    const user = await User.findById(payload.sub).select(
      "_id name email phone role is_verified is_anonymous"
    );
    if (!user) {
      await writeAdminLog({
        level: "warn",
        module: "auth",
        message: "ME: user not found",
        user_id: payload.sub,
        request_id: reqId(req),
        meta: { ip: ip(req), ua: ua(req) },
      });
      return res.status(404).json({ error: "User not found" });
    }

    await writeAdminLog({
      level: "info",
      module: "auth",
      message: "ME: user fetched",
      user_id: user._id,
      request_id: reqId(req),
      meta: { ip: ip(req), ua: ua(req) },
    });

    return res.json({ message: "User fetched successfully", user });
  } catch (err) {
    await writeAdminLog({
      level: "error",
      module: "auth",
      message: "ME: server error",
      user_id: null,
      request_id: reqId(req),
      meta: {
        error: String((err as any)?.message || err),
        ip: ip(req),
        ua: ua(req),
      },
    });
    console.error("ME endpoint error:", err);
    return res.status(500).json({ error: "Failed to fetch user" });
  }
};

// ---------- REFRESH ----------
export const refreshToken = async (req: Request, res: Response) => {
  try {
    let token = req.cookies?.["refresh_token"] as string | undefined;

    if (!token && typeof req.body?.refresh_token === "string") {
      token = req.body.refresh_token;
    }

    if (!token) {
      const auth = req.get("authorization") || req.get("Authorization") || "";
      if (auth.startsWith("Bearer ")) token = auth.slice(7).trim();
    }

    if (!token) {
      await writeAdminLog({
        level: "warn",
        module: "auth",
        message: "Refresh: missing token",
        user_id: null,
        request_id: reqId(req),
        meta: { ip: ip(req), ua: ua(req) },
      });
      return res.status(401).json({ error: "No refresh token" });
    }

    const payload = verifyRefresh(token);
    if (!payload) {
      await writeAdminLog({
        level: "error",
        module: "auth",
        message: "Refresh: invalid token",
        user_id: null,
        request_id: reqId(req),
        meta: { ip: ip(req), ua: ua(req) },
      });
      return res.status(403).json({ error: "Invalid refresh token" });
    }

    const user = await User.findById(payload.sub, { role: 1 });
    if (!user) {
      await writeAdminLog({
        level: "error",
        module: "auth",
        message: "Refresh: user not found",
        user_id: payload.sub,
        request_id: reqId(req),
        meta: { ip: ip(req), ua: ua(req) },
      });
      return res.status(403).json({ error: "User not found" });
    }

    const access = signAccess({
      sub: String(user._id),
      role: user.role as JwtPayload["role"],
    });

    res.cookie("access_token", access, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 30 * 60 * 1000,
      path: "/",
    });

    await writeAdminLog({
      level: "info",
      module: "auth",
      message: "Refresh: access token issued",
      user_id: user._id,
      request_id: reqId(req),
      meta: { role: user.role, ip: ip(req), ua: ua(req) },
    });

    return res.json({ access_token: access });
  } catch (err) {
    await writeAdminLog({
      level: "error",
      module: "auth",
      message: "Refresh: server error",
      user_id: null,
      request_id: reqId(req),
      meta: {
        error: String((err as any)?.message || err),
        ip: ip(req),
        ua: ua(req),
      },
    });
    console.error("REFRESH error:", err);
    return res.status(500).json({ error: "Failed to refresh token" });
  }
};

// ---------- LOGOUT ----------
export const logout = async (_req: Request, res: Response) => {
  await writeAdminLog({
    level: "info",
    module: "auth",
    message: "Logout",
    user_id: null,
    request_id: (_req as any).request_id || undefined,
    meta: { ip: ip(_req), ua: ua(_req) },
  });
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/auth" });
  return res.json({ message: "Logged out" });
};

// ---------- FORGOT / RESET ----------
export const forgotPassword = async (req: Request, res: Response) => {
  const err = requireFields(req.body, ["email"]);
  if (err) {
    await writeAdminLog({
      level: "warn",
      module: "auth",
      message: "Forgot password: missing email",
      user_id: null,
      request_id: reqId(req),
      meta: { error: err, ip: ip(req), ua: ua(req) },
    });
    return res.status(400).json({ error: err });
  }

  const { email } = req.body;
  if (!isEmail(email)) {
    await writeAdminLog({
      level: "warn",
      module: "auth",
      message: "Forgot password: invalid email",
      user_id: null,
      request_id: reqId(req),
      meta: { email, ip: ip(req), ua: ua(req) },
    });
    return res.status(400).json({ error: "Invalid email" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    await writeAdminLog({
      level: "info",
      module: "auth",
      message: "Forgot password: email not found (generic response)",
      user_id: null,
      request_id: reqId(req),
      meta: { email, ip: ip(req), ua: ua(req) },
    });
    return res.json({ message: "If the email exists, an OTP has been sent." });
  }

  const code = generateNumericOTP(6);
  const otp_hash = await hashOTP(code);
  await OtpToken.create({
    user_id: user._id,
    otp_hash,
    expires_at: dayjs().add(30, "minute").toDate(),
  });

  await sendOTP(email, code);

  await writeAdminLog({
    level: "info",
    module: "auth",
    message: "Forgot password: OTP issued",
    user_id: user._id,
    request_id: reqId(req),
    meta: { email, otp_expires_in_min: 30, ip: ip(req), ua: ua(req) },
  });

  return res.json({ message: "If the email exists, an OTP has been sent." });
};

export const resetPassword = async (req: Request, res: Response) => {
  const err = requireFields(req.body, ["email", "code", "new_password"]);
  if (err) {
    await writeAdminLog({
      level: "warn",
      module: "auth",
      message: "Reset password: missing fields",
      user_id: null,
      request_id: reqId(req),
      meta: { error: err, ip: ip(req), ua: ua(req) },
    });
    return res.status(400).json({ error: err });
  }

  const { email, code, new_password } = req.body as {
    email: string;
    code: string;
    new_password: string;
  };

  if (!isEmail(email)) {
    await writeAdminLog({
      level: "warn",
      module: "auth",
      message: "Reset password: invalid email",
      user_id: null,
      request_id: reqId(req),
      meta: { email, ip: ip(req), ua: ua(req) },
    });
    return res.status(400).json({ error: "Invalid email" });
  }
  if (!isOtp(code)) {
    await writeAdminLog({
      level: "warn",
      module: "auth",
      message: "Reset password: invalid OTP format",
      user_id: null,
      request_id: reqId(req),
      meta: { email, ip: ip(req), ua: ua(req) },
    });
    return res.status(400).json({ error: "Invalid code" });
  }
  if (!hasMin(new_password, 8)) {
    await writeAdminLog({
      level: "warn",
      module: "auth",
      message: "Reset password: weak password",
      user_id: null,
      request_id: reqId(req),
      meta: { email, ip: ip(req), ua: ua(req) },
    });
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    await writeAdminLog({
      level: "warn",
      module: "auth",
      message: "Reset password: email not found",
      user_id: null,
      request_id: reqId(req),
      meta: { email, ip: ip(req), ua: ua(req) },
    });
  }
  if (!user) return res.status(400).json({ error: "Invalid OTP or email" });

  const token = await OtpToken.findOne({
    user_id: user._id,
    verified: false,
  }).sort({ created_at: -1 });
  if (!token) {
    await writeAdminLog({
      level: "warn",
      module: "auth",
      message: "Reset password: otp not found/expired",
      user_id: user._id,
      request_id: reqId(req),
      meta: { email, ip: ip(req), ua: ua(req) },
    });
  }
  if (!token) return res.status(400).json({ error: "Invalid or expired OTP" });
  if (dayjs(token.expires_at).isBefore(dayjs())) {
    await writeAdminLog({
      level: "warn",
      module: "auth",
      message: "Reset password: OTP expired",
      user_id: user._id,
      request_id: reqId(req),
      meta: { email, expires_at: token.expires_at, ip: ip(req), ua: ua(req) },
    });
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  const ok = await matchOTP(code, token.otp_hash);
  if (!ok) {
    await writeAdminLog({
      level: "warn",
      module: "auth",
      message: "Reset password: OTP mismatch",
      user_id: user._id,
      request_id: reqId(req),
      meta: { email, ip: ip(req), ua: ua(req) },
    });
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  const password_hash = await bcrypt.hash(new_password, 12);
  await Promise.all([
    User.updateOne(
      { _id: user._id },
      { $set: { password_hash, updated_at: new Date() } }
    ),
    OtpToken.updateOne({ _id: token._id }, { $set: { verified: true } }),
  ]);

  await sendPasswordReset(email, "http://localhost:3000/auth/resetPassword");

  await writeAdminLog({
    level: "audit",
    module: "auth",
    message: "Reset password: success",
    user_id: user._id,
    request_id: reqId(req),
    meta: { email, ip: ip(req), ua: ua(req) },
  });

  return res.json({ message: "Password reset successful" });
};
