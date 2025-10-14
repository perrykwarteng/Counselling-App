import type { IUser } from "../models/user.model";

type SafeUser = Omit<IUser, "password_hash">;

export function serializeUserForSelf(
  u: IUser,
  viewerRole: IUser["role"]
): SafeUser {
  // Start with all allowed fields
  const base: SafeUser = {
    _id: u._id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    counselor_type: u.counselor_type,
    availability: u.availability,
    specialities: u.specialities,
    is_verified: u.is_verified,
    is_anonymous: u.is_anonymous,
    is_active: u.is_active,
    avatar_url: u.avatar_url,
    profile: u.profile,
    created_at: u.created_at,
    updated_at: u.updated_at,
  };

  // If the viewer is a student, hide counselor-only fields
  if (viewerRole === "student") {
    base.counselor_type = undefined;
    base.availability = undefined;
    base.specialities = undefined;
  }

  return base;
}
