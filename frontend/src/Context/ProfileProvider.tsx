"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import axios, { AxiosError, AxiosInstance } from "axios";
import { toast } from "sonner";
import type { User } from "@/types/auth";
import { createApiClient } from "@/lib/http/createApiClient";
import { useAuth } from "./AuthProvider";

const ACCESS_KEY = "auth_access_token";
const REFRESH_KEY = "auth_refresh_token";

export type UpdateMePayload = Partial<{
  name: string;
  phone: string;
  is_anonymous: boolean;
  avatar_url: string | null;
  profile: { department: string | null; level: string | null };
  counselor_type: "academic" | "professional" | null;
  availability: string[];
  specialities: string[];
}>;

type ChangePasswordPayload = {
  current_password: string;
  new_password: string;
};

type ProfileContextType = {
  me: User | null;
  loading: boolean;
  updating: boolean;
  changingPassword: boolean;
  deleting: boolean;
  refresh: () => Promise<User | null>;
  ensureLoaded: () => Promise<User | null>;
  updateProfile: (payload: UpdateMePayload) => Promise<User | null>;
  changePassword: (payload: ChangePasswordPayload) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

function buildProfileApi(): AxiosInstance {
  const base = (process.env.NEXT_PUBLIC_APP_BASE_URL || "").replace(/\/$/, "");
  return createApiClient({
    baseURL: base,
    withCredentials: true,

    getAccessToken: () =>
      typeof window !== "undefined" ? localStorage.getItem(ACCESS_KEY) : null,
    getRefreshToken: () =>
      typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null,
    saveTokens: async ({ accessToken, refreshToken }) => {
      if (typeof window === "undefined") return;
      if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
      if (typeof refreshToken !== "undefined") {
        if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
        else localStorage.removeItem(REFRESH_KEY);
      }
    },

    tokenHeaderName: "Authorization",
    formatToken: (t) => `Bearer ${t}`,

    onUnauthorized: () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
      }
    },
  });
}

function pickUser(data: any): User {
  return (
    data && typeof data === "object" && "user" in data ? data.user : data
  ) as User;
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser } = useAuth();
  const [me, setMe] = useState<User | null>(authUser ?? null);
  const [loading, setLoading] = useState(!authUser);
  const [updating, setUpdating] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const api = useMemo(buildProfileApi, []);

  const refresh = async (): Promise<User | null> => {
    try {
      setLoading(true);
      const { data } = await api.get<User | { user: User }>("/user/users/me");
      const user = pickUser(data);
      setMe(user);
      return user;
    } catch {
      setMe(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const ensureLoaded = async (): Promise<User | null> => {
    if (me) return me;
    return await refresh();
  };

  const updateProfile = async (
    payload: UpdateMePayload
  ): Promise<User | null> => {
    if (!me) return null;
    try {
      setUpdating(true);
      const { data } = await api.patch<User | { user: User; message?: string }>(
        "/user/users/me",
        payload,
        { headers: { "Content-Type": "application/json" } }
      );
      const user = pickUser(data);
      setMe(user);
      const message = (data as any)?.message || "Profile updated";
      toast.success(message);
      return user;
    } catch (err) {
      const e = err as AxiosError<{ error?: string; message?: string }>;
      toast.error(
        e.response?.data?.error ||
          e.response?.data?.message ||
          "Failed to update profile"
      );
      return null;
    } finally {
      setUpdating(false);
    }
  };

  const changePassword = async (
    payload: ChangePasswordPayload
  ): Promise<boolean> => {
    try {
      setChangingPassword(true);
      const { data } = await api.post<{ message?: string }>(
        "/user/user/change-password",
        payload,
        { headers: { "Content-Type": "application/json" } }
      );
      toast.success(data?.message || "Password updated");
      return true;
    } catch (err) {
      const e = err as AxiosError<{ error?: string; message?: string }>;
      toast.error(
        e.response?.data?.error ||
          e.response?.data?.message ||
          "Failed to change password"
      );
      return false;
    } finally {
      setChangingPassword(false);
    }
  };

  const deleteAccount = async (): Promise<boolean> => {
    if (!me) return false;
    try {
      setDeleting(true);
      await api.delete("/user/auth/delete-account");
      setMe(null);
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      toast.success("Account deleted");
      return true;
    } catch (err) {
      const e = err as AxiosError<{ error?: string; message?: string }>;
      toast.error(
        e.response?.data?.error ||
          e.response?.data?.message ||
          "Failed to delete account"
      );
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        me,
        loading,
        updating,
        changingPassword,
        deleting,
        refresh,
        ensureLoaded,
        updateProfile,
        changePassword,
        deleteAccount,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = (): ProfileContextType => {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
};
