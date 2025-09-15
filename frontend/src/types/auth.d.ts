// src/types/auth.ts
export type UserRole = "admin" | "student" | "counselor";

export interface User {
  id?: string;           
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  is_verified: boolean;
  is_anonymous: boolean;
}
