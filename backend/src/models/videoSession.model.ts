import { Schema, model, Types, Document } from "mongoose";

export interface VideoSession extends Document {
  appointment_id: Types.ObjectId;
  session_token_hash: string | null;
  expires_at: Date | null;
  revoked: boolean;
  createdAt: Date;
  updatedAt: Date;
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
    session_token_hash: { type: String, default: null },
    expires_at: { type: Date, default: null },
    revoked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const VideoSessionModel = model<VideoSession>(
  "VideoSession",
  VideoSessionSchema
);
