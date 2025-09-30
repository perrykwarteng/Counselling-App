// appointment.model.ts
import { Schema, model, Types, Document } from "mongoose";

export type AppointmentStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "completed"
  | "cancelled";

export type AppointmentMode = "chat" | "video" | "in-person";

export interface Appointment extends Document {
  student_id: Types.ObjectId;
  counselor_id: Types.ObjectId;
  scheduled_at: Date;
  status: AppointmentStatus;
  mode: AppointmentMode;
  referral_id?: Types.ObjectId;
  in_person_location?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const AppointmentSchema = new Schema<Appointment>(
  {
    student_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    counselor_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    scheduled_at: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    mode: {
      type: String,
      enum: ["chat", "video", "in-person"],
      required: true,
    },
    referral_id: { type: Schema.Types.ObjectId, ref: "Referral" },
    in_person_location: { type: String },
    notes: { type: String },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

AppointmentSchema.index({ counselor_id: 1, status: 1 });
AppointmentSchema.index({ student_id: 1 });
AppointmentSchema.index({ scheduled_at: 1 });

export const AppointmentModel = model<Appointment>(
  "Appointment",
  AppointmentSchema
);

export type AppointmentDocument = Appointment;
