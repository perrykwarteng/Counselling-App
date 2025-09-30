import { Schema, model, Types, Document } from "mongoose";

export interface IChatMessage extends Document {
  session_id: Types.ObjectId;
  sender_id: Types.ObjectId;
  content: string;
  is_read: boolean;
  is_system: boolean;
  created_at: Date;
  updated_at: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    session_id: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      index: true,
    },
    sender_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: { type: String, required: true, trim: true },
    is_read: { type: Boolean, default: false },
    is_system: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

ChatMessageSchema.index({ session_id: 1, created_at: 1 });

ChatMessageSchema.index({ content: "text" });

export const ChatMessageModel = model<IChatMessage>(
  "ChatMessage",
  ChatMessageSchema
);
