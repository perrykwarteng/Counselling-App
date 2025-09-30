import { Schema, model, Types, Document } from "mongoose";

export interface VideoSession extends Document {
  appointment_id: Types.ObjectId;
  session_token: string;
  started_at?: Date;
  ended_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const VideoSessionSchema = new Schema<VideoSession>(
  {
    appointment_id: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      unique: true,
      required: true,
      index: true,
    },
    session_token: { type: String, required: true },
    started_at: { type: Date },
    ended_at: { type: Date },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

VideoSessionSchema.index({ appointment_id: 1, session_token: 1 });

export const VideoSessionModel = model<VideoSession>(
  "VideoSession",
  VideoSessionSchema
);
