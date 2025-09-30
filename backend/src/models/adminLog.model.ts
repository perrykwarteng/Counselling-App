// src/models/adminLog.model.ts
import { Schema, model } from "mongoose";
import { v4 as uuid } from "uuid";

export type LogLevel = "info" | "warn" | "error" | "audit";

export interface IAdminLog {
  _id: string;
  timestamp: Date;
  level: LogLevel;
  module: string;
  message: string;
  user_id?: string | null;
  request_id?: string | null;
  meta?: Record<string, any>;
}

const adminLogSchema = new Schema<IAdminLog>(
  {
    _id: { type: String, default: uuid },
    timestamp: { type: Date, default: () => new Date(), index: true },
    level: {
      type: String,
      enum: ["info", "warn", "error", "audit"],
      required: true,
      index: true,
    },
    module: { type: String, required: true, index: true },
    message: { type: String, required: true },
    user_id: { type: String, default: null, index: true },
    request_id: { type: String, default: null, index: true },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  {
    versionKey: false,
    collection: "admin_logs",
  }
);

adminLogSchema.index({ module: 1, timestamp: -1 });

export const AdminLog = model<IAdminLog>("admin_logs", adminLogSchema);
