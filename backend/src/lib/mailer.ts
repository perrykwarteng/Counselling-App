import nodemailer from "nodemailer";
import { env } from "../config";


const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 587,
  secure: false,
  auth: {
    user: env.GMAIL_USER,
    pass: env.GMAIL_PASS,
  },
});

export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html?: string
) => {
  const info = await transporter.sendMail({
    from: `"Counselling App" <${env.GMAIL_USER}>`,
    to,
    subject,
    text, 
    html, // branded HTML
  });

  console.log("📨 Email sent: %s", info.messageId);
};
