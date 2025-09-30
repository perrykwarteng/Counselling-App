// src/models/referral.model.ts
import { Schema, model } from "mongoose";
import { v4 as uuid } from "uuid";

export interface IReferral {
  _id: string;
  referred_by: string;
  student_id: string;
  counselor_id: string;
  reason?: string | null;
  created_at: Date;
}

const referralSchema = new Schema<IReferral>(
  {
    _id: { type: String, default: uuid },
    referred_by: { type: String, required: true, index: true },
    student_id: { type: String, required: true, index: true },
    counselor_id: { type: String, required: true, index: true },
    reason: { type: String, default: null },
    created_at: { type: Date, default: () => new Date() },
  },
  { versionKey: false, collection: "referrals" }
);

export const Referral = model<IReferral>("referrals", referralSchema);
