import dotenv from "dotenv";
dotenv.config();
export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 4000,
  MONGODB_URI: process.env.MONGODB_URI!,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  APP_URL: process.env.APP_URL || "http://localhost:4000",
  APP_FRONTEND_URL: process.env.APP_FRONTEND_URL || "http://localhost:3000",
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  MAIL_FROM: process.env.MAIL_FROM,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  GMAIL_USER: process.env.GMAIL_USER,
  GMAIL_PASS: process.env.GMAIL_PASS,
  VIDEO_PROVIDER: (process.env.VIDEO_PROVIDER || "native").toLowerCase(),
  METERED_DOMAIN: process.env.METERED_DOMAIN || "",
  METERED_SECRET: process.env.METERED_SECRET || "",
  METERED_API_KEY: process.env.METERED_API_KEY || "",
};
