import nodemailer from 'nodemailer';
import twilio from 'twilio';


const transporter = nodemailer.createTransport({
host: process.env.SMTP_HOST,
port: Number(process.env.SMTP_PORT || 587),
secure: false,
auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});


const sms = twilio(process.env.TWILIO_SID as string, process.env.TWILIO_TOKEN as string);


export async function sendEmail(to: string | undefined | null, subject: string, html: string) {
if (!to) return;
await transporter.sendMail({ from: process.env.SMTP_USER, to, subject, html });
}


export async function sendSMS(to: string | undefined | null, body: string) {
if (!to) return; 
await sms.messages.create({ to, from: process.env.TWILIO_FROM as string, body });
}


export function apptLink(appointmentId: string, tab: 'chat' | 'details' = 'chat') {
return `${process.env.APP_BASE_URL}/appointments/${appointmentId}?tab=${tab}`;
}