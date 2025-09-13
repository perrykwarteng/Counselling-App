import { Schema, model } from "mongoose";
import { v4 as uuid } from "uuid";

export type Role = "student" | "counselor" | "admin";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  password_hash: string;
  role: Role;
  is_verified: boolean;
  is_anonymous: boolean;
  avatar_url?: string;
  created_at: Date;
}

const userSchema = new Schema<IUser>(
  {
    _id: { type: String, default: uuid },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    phone: { type: String, index: true },
    password_hash: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "counselor", "admin"],
      default: "student",
    },
    is_verified: { type: Boolean, default: false },
    is_anonymous: { type: Boolean, default: false },
    avatar_url: { type: String },
    created_at: { type: Date, default: () => new Date() },
  },
  { versionKey: false }
);

export const User = model<IUser>("users", userSchema);
