"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axiosLib, { AxiosError, AxiosHeaders, AxiosInstance } from "axios";
import { toast } from "sonner";
import type { User } from "@/types/auth";

type VerifyOtpPayload = { user_id: string; code: string };
type AuthContextType = {
  user: User | null;
  loading: boolean;
  register: (data: {
    name: string;
    email: string;
    password: string;
  }) => Promise<string | null>;
  verifyOtp: (data: VerifyOtpPayload) => Promise<User | null>;
  login: (data: { email: string; password: string }) => Promise<User | null>;
  logout: () => Promise<void>;
  forgotPassword: (data: { email: string }) => Promise<void>;
  resetPassword: (data: {
    code: string;
    email: string;
    new_password: string;
  }) => Promise<void>;
};

type VerifyOtpResponse = {
  message: string;
  access_token: string;
  refresh_token: string;
};

type LoginResponse = {
  message: string;
  access_token: string;
  refresh_token: string;
};

type RegisterResponse = { message: string; user_id: string };

type RefreshResponse = { access_token: string; refresh_token?: string };
type MeResponse = { user: User };

const ACCESS_KEY = "auth_access_token";
const REFRESH_KEY = "auth_refresh_token";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function buildAxios(): AxiosInstance {
  const base =
    (process.env.NEXT_PUBLIC_APP_BASE_URL &&
      `${process.env.NEXT_PUBLIC_APP_BASE_URL.replace(/\/$/, "")}/auth`) ||
    "/auth";

  const instance = axiosLib.create({
    baseURL: base,
    withCredentials: true,
  });

  if (typeof window !== "undefined") {
    const t = localStorage.getItem(ACCESS_KEY);
    if (t) instance.defaults.headers.common.Authorization = `Bearer ${t}`;
  }

  return instance;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const api = useMemo(buildAxios, []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshingRef = useRef(false);

  useEffect(() => {
    const isAuthRoute = (url = "") =>
      /\/(login|register|verify-otp|forgot-password|reset-password|refresh)(\/|$)/.test(
        url
      );

    const interceptor = api.interceptors.response.use(
      (res) => res,
      async (error: AxiosError) => {
        const status = error.response?.status ?? 0;
        const original = error.config as
          | (typeof error.config & { _retry?: boolean })
          | undefined;
        const url = original?.url || "";

        if (
          status !== 401 ||
          !original ||
          original._retry ||
          isAuthRoute(url)
        ) {
          return Promise.reject(error);
        }

        const refresh =
          typeof window !== "undefined"
            ? localStorage.getItem(REFRESH_KEY)
            : null;
        if (!refresh) return Promise.reject(error);

        try {
          refreshingRef.current = true;

          let data: RefreshResponse;
          try {
            const r = await api.post<RefreshResponse>("/refresh", {
              refresh_token: refresh,
            });
            data = r.data;
          } catch {
            const r2 = await api.post<RefreshResponse>("/refresh", null, {
              headers: { Authorization: `Bearer ${refresh}` },
            });
            data = r2.data;
          }

          const newAccess = data.access_token;
          const newRefresh = data.refresh_token ?? refresh;

          if (typeof window !== "undefined") {
            localStorage.setItem(ACCESS_KEY, newAccess);
            localStorage.setItem(REFRESH_KEY, newRefresh);
          }

          api.defaults.headers.common.Authorization = `Bearer ${newAccess}`;

          const headers = AxiosHeaders.from(original.headers ?? {});
          headers.set("Authorization", `Bearer ${newAccess}`);
          original.headers = headers;
          original._retry = true;

          return api(original);
        } catch {
          if (typeof window !== "undefined") {
            localStorage.removeItem(ACCESS_KEY);
            localStorage.removeItem(REFRESH_KEY);
          }
          setUser(null);
          toast.error("Session expired. Please login again.");
          return Promise.reject(error);
        } finally {
          refreshingRef.current = false;
        }
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [api]);

  useEffect(() => {
    (async () => {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem(ACCESS_KEY)
            : null;
        if (token) {
          api.defaults.headers.common.Authorization = `Bearer ${token}`;
          const { data } = await api.get<MeResponse>("/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(data.user);
        }
      } catch {
        if (typeof window !== "undefined") {
          localStorage.removeItem(ACCESS_KEY);
          localStorage.removeItem(REFRESH_KEY);
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [api]);

  // Register
  const register: AuthContextType["register"] = async (payload) => {
    try {
      const { data } = await api.post<RegisterResponse>("/register", payload);
      toast.success(data.message);
      return data.user_id;
    } catch (err) {
      const error = err as AxiosError<{ error?: string }>;
      toast.error(error.response?.data?.error || "Registration failed");
      return null;
    }
  };

  const verifyOtp: AuthContextType["verifyOtp"] = async (payload) => {
    try {
      const { data } = await api.post<VerifyOtpResponse>(
        "/verify-otp",
        payload
      );

      if (typeof window !== "undefined") {
        localStorage.setItem("auth_access_token", data.access_token);
        localStorage.setItem("auth_refresh_token", data.refresh_token);
      }

      api.defaults.headers.common.Authorization = `Bearer ${data.access_token}`;
      const me = await api.get<{ user: User }>("/me", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });

      setUser(me.data.user);
      toast.success(data.message);
      return me.data.user;
    } catch (err) {
      const error = err as AxiosError<{ error?: string }>;
      toast.error(error.response?.data?.error || "OTP verification failed");
      return null;
    }
  };

  //   Login
  const login: AuthContextType["login"] = async (payload) => {
    try {
      const { data } = await api.post<LoginResponse>("/login", payload);

      if (typeof window !== "undefined") {
        localStorage.setItem(ACCESS_KEY, data.access_token);
        localStorage.setItem(REFRESH_KEY, data.refresh_token);
      }

      api.defaults.headers.common.Authorization = `Bearer ${data.access_token}`;
      const me = await api.get<MeResponse>("/me", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });

      setUser(me.data.user);
      toast.success(data.message);
      return me.data.user;
    } catch (err) {
      const error = err as AxiosError<{ error?: string }>;
      toast.error(error.response?.data?.error || "Login failed");
      return null;
    }
  };

  //   Logout
  const logout: AuthContextType["logout"] = async () => {
    try {
      await api.post<{ message: string }>("/logout").catch(() => {});
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
      }
      setUser(null);
      toast.success("Logged out");
    }
  };

  //   ForgotPassword
  const forgotPassword: AuthContextType["forgotPassword"] = async (payload) => {
    try {
      const { data } = await api.post<{ message: string }>(
        "/forgot-password",
        payload
      );
      toast.success(data.message);
    } catch (err) {
      const error = err as AxiosError<{ error?: string }>;
      toast.error(error.response?.data?.error || "Failed to send reset email");
    }
  };

  //   ResetPassword
  const resetPassword: AuthContextType["resetPassword"] = async (payload) => {
    try {
      const { data } = await api.post<{ message: string }>(
        "/reset-password",
        payload
      );
      toast.success(data.message);
    } catch (err) {
      const error = err as AxiosError<{ error?: string }>;
      toast.error(error.response?.data?.error || "Password reset failed");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-12 h-12 border-4 border-[#131b62] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        verifyOtp,
        login,
        logout,
        forgotPassword,
        resetPassword,
      }}
    >
      <div className="animate-fade-in">{children}</div>
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
