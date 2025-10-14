import { env } from "../config";
import { buildEmailTemplate } from "./emailTemplates";
import { sendEmail } from "./mailer";

// OTP Email
export async function sendOTP(to: string, code: string) {
  const html = buildEmailTemplate(
    "Your OTP Code",
    `
      <p>Hello,</p>
      <p>Your one-time password (OTP) is:</p>
      <div class="highlight">${code}</div>
      <p>This code will expire in 10 minutes.</p>
    `
  );
  await sendEmail(to, "Your OTP Code", `Your OTP is ${code}`, html);

  if (env.NODE_ENV === "development") {
    console.log(`[DEV] OTP for ${to}: ${code}`);
    return;
  }
}

// Password Reset Email
export async function sendPasswordReset(to: string, link: string) {
  const html = buildEmailTemplate(
    "Reset Your Password",
    `
      <p>Hello,</p>
      <p>You requested a password reset. Click the button below:</p>
      <p><a href="${link}" class="button">Reset Password</a></p>
      <p>If you didn’t request this, just ignore this email.</p>
    `
  );

  await sendEmail(
    to,
    "Reset Your Password",
    `Click here to reset your password: ${link}`,
    html
  );
}

// Welcome Email
export async function sendWelcomeEmail(to: string, name: string) {
  const html = buildEmailTemplate(
    "Welcome to Counseling Platform 🎉",
    `
      <p>Hi ${name},</p>
      <p>Welcome to <b>Counseling Platform</b>! We're excited to have you onboard.</p>
      <p>You can now book sessions, access resources, and connect with our counselors anytime.</p>
      <p><a href="${env.APP_URL}/login" class="button">Get Started</a></p>
      <p>If you have questions, reply to this email — we’re here to help.</p>
    `
  );

  await sendEmail(
    to,
    "Welcome to Counseling Platform 🎉",
    `Welcome ${name}, you can now start using Counseling Platform.`,
    html
  );
}

export async function sendCounselorOnboarding(
  to: string,
  name: string,
  tempPassword: string,
  otp: string,
  uid: string,
  expiresInMinutes = 30
) {
  const verifyUrl = `${
    env.APP_FRONTEND_URL
  }/auth/optVerify?uid=${encodeURIComponent(uid)}`;

  const subject = "Counselor Account Setup — Temp Password & OTP";
  const html = buildEmailTemplate(
    "Counselor Account Setup",
    `
      <p>Hi ${name},</p>
      <p>Your counselor account has been created. Below are your temporary credentials and verification steps.</p>

      <ul>
        <li><b>Email:</b> ${to}</li>
        <li><b>Temporary Password:</b> ${tempPassword}</li>
      </ul>

      <p>Your one-time code (OTP) is:</p>
      <div class="highlight">${otp}</div>
      <p>This code will expire in ${expiresInMinutes} minutes.</p>

      <p>Click the button below to open the verification page, then enter your OTP:</p>
      <p>
        <a href="${verifyUrl}" class="button">Verify your account</a>
      </p>

      <p>If the button doesn’t work, copy and paste this link:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>

      <p>After verification, log in with the temporary password and change it.</p>
    `
  );

  const text = [
    `Hi ${name},`,
    ``,
    `Your counselor account has been created.`,
    ``,
    `Email: ${to}`,
    `Temporary Password: ${tempPassword}`,
    `OTP: ${otp} (expires in ${expiresInMinutes} minutes)`,
    ``,
    `Verify your account: ${verifyUrl}`,
    ``,
    `After verification, log in with the temporary password and change it.`,
  ].join("\n");

  await sendEmail(to, subject, text, html);

  if (env.NODE_ENV === "development") {
    console.log(`[DEV] Counselor onboarding for ${to}:
  Temp Password: ${tempPassword}
  OTP: ${otp}
  Verify: ${verifyUrl}`);
    return;
  }
}

export async function sendVideoSessionEmail(
  to: string,
  scheduledAt: Date,
  joinUrl: string,
  meta?: Record<string, any>
) {
  const html = buildEmailTemplate(
    "Your Video Session is Ready 🎥",
    `
    <p>Hello,</p>
    <p>Your video session is scheduled for ${scheduledAt.toLocaleString()}.</p>
    <p>Click the link below to join your session:</p>
    <p><a href="${joinUrl}" class="button">Join Video Session</a></p>
    `
  );

  const text = `Hello,\n\nYour video session is scheduled for ${scheduledAt.toLocaleString()}.\nJoin here: ${joinUrl}`;

  await sendEmail(to, "Your Video Session is Ready", text, html);

  if (env.NODE_ENV === "development") {
    console.log(`[DEV] Video session email for ${to}: ${joinUrl}`, meta);
  }
}

export async function sendInPersonSessionEmail(
  to: string,
  details: string,
  meta?: Record<string, any>
) {
  const html = buildEmailTemplate(
    "Your In-Person Session is Scheduled 📍",
    `
    <p>Hello,</p>
    <p>Your in-person counseling session has been scheduled:</p>
    <p><b>${details}</b></p>
    <p>Please arrive a few minutes early and bring any necessary materials.</p>
    `
  );

  const text = `Hello,\n\nYour in-person counseling session is scheduled:\n${details}\n\nPlease arrive a few minutes early.`;

  await sendEmail(to, "In-Person Session Scheduled", text, html);

  if (env.NODE_ENV === "development") {
    console.log(`[DEV] In-person session email for ${to}: ${details}`, meta);
  }
}

export async function sendChatSessionEmail(
  to: string,
  chatLink: string,
  meta?: Record<string, any>
) {
  const html = buildEmailTemplate(
    "Your Chat Session is Ready 💬",
    `
    <p>Hello,</p>
    <p>Your chat session is now open with your counselor.</p>
    <p>Click the link below to start chatting:</p>
    <p><a href="${chatLink}" class="button">Go to Chat Session</a></p>
    `
  );

  const text = `Hello,\n\nYour chat session is now open with your counselor.\nJoin here: ${chatLink}`;

  await sendEmail(to, "Chat Session Open", text, html);

  if (env.NODE_ENV === "development") {
    console.log(`[DEV] Chat session email for ${to}: ${chatLink}`, meta);
  }
}
