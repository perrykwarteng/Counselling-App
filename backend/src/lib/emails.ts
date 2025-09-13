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
