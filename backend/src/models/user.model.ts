import { Schema, model } from "mongoose";
import { v4 as uuid } from "uuid";

export type Role = "student" | "counselor" | "admin";
export type CounselorType = "academic" | "professional" | null;

export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  password_hash: string;
  role: Role;
  counselor_type?: CounselorType;
  availability?: string[];
  specialities?: string[];
  is_verified: boolean;
  is_anonymous: boolean;
  is_active: boolean;
  avatar_url?: string;
  profile?: {
    department?: string;
    level?: string;
  };
  created_at: Date;
  updated_at: Date;
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

    counselor_type: {
      type: String,
      enum: ["academic", "professional", null],
      default: null,
    },

    availability: {
      type: [String],
      default: [],
    },

    specialities: {
      type: [String],
      default: [],
    },

    is_verified: { type: Boolean, default: false },
    is_anonymous: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },

    avatar_url: { type: String },

    profile: {
      department: { type: String, default: null },
      level: { type: String, default: null },
    },

    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
  },
  { versionKey: false }
);

export const User = model<IUser>("users", userSchema);
