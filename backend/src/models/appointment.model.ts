import { Schema, model, Document } from "mongoose";

// --------------------
// Types
// --------------------
export type AppointmentStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "completed"
  | "cancelled";

export type AppointmentMode = "chat" | "video" | "in-person";

export interface Appointment extends Document {
  student_id: string;           // store model-level ids (string/uuid), NOT ObjectIds
  counselor_id: string;
  scheduled_at: Date;
  status: AppointmentStatus;
  mode: AppointmentMode;
  referral_id?: string;
  in_person_location?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const AppointmentSchema = new Schema<Appointment>(
  {
    student_id: { type: String, required: true },
    counselor_id: { type: String, required: true },
    scheduled_at: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed", "cancelled"],
      default: "pending",
    },
    mode: {
      type: String,
      enum: ["chat", "video", "in-person"],
      required: true,
    },
    referral_id: { type: String },
    in_person_location: { type: String },
    notes: { type: String },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// --------------------
// Indexes
// --------------------
// Compound index to quickly query counselor appointments by status
AppointmentSchema.index({ counselor_id: 1, status: 1 });

// Index to quickly find appointments for a student
AppointmentSchema.index({ student_id: 1 });

// Index for scheduling queries
AppointmentSchema.index({ scheduled_at: 1 });

// --------------------
// Model Export
// --------------------
export const AppointmentModel = model<Appointment>(
  "Appointment",
  AppointmentSchema
);

export type AppointmentDocument = Appointment;
