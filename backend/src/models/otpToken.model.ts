import { Schema, model } from "mongoose";
import { v4 as uuid } from "uuid";

export interface IOtpToken {
  _id: string;
  user_id: string;
  otp_hash: string;
  expires_at: Date;
  verified: boolean;
  created_at: Date;
}

const otpSchema = new Schema<IOtpToken>(
  {
    _id: { type: String, default: uuid },
    user_id: { type: String, required: true, index: true },
    otp_hash: { type: String, required: true },
    expires_at: { type: Date, required: true, index: true },
    verified: { type: Boolean, default: false, index: true },
    created_at: { type: Date, default: () => new Date() },
  },
  { versionKey: false }
);

export const OtpToken = model<IOtpToken>("otp_tokens", otpSchema);
