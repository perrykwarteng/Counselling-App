"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  PropsWithChildren,
} from "react";
import type { AxiosInstance } from "axios";
import axios from "axios";
import { toast } from "sonner";
import { createApiClient } from "@/lib/http/createApiClient";

/* ========= Types ========= */
export type LogLevel = "info" | "warn" | "error" | "audit";

export type LogRow = {
  id: string; // normalized
  timestamp: string; // ISO
  level: LogLevel;
  module: string;
  message: string;
  user_id?: string | null;
  request_id?: string | null;
  meta?: Record<string, any>;
};

/* ========= Admin API ========= */
const ACCESS_KEY = "auth_access_token";
const REFRESH_KEY = "auth_refresh_token";

function useAdminApi(): { api: AxiosInstance; base: string } {
  const base = process.env.NEXT_PUBLIC_APP_BASE_URL?.replace(/\/$/, "") || "";

  const api = useMemo(
    () =>
      createApiClient({
        baseURL: base,
        withCredentials: true,

        getAccessToken: () =>
          typeof window !== "undefined"
            ? localStorage.getItem(ACCESS_KEY)
            : null,

        getRefreshToken: () =>
          typeof window !== "undefined"
            ? localStorage.getItem(REFRESH_KEY)
            : null,

        saveTokens: async ({ accessToken, refreshToken }) => {
          if (typeof window === "undefined") return;
          localStorage.setItem(ACCESS_KEY, accessToken);
          if (typeof refreshToken !== "undefined") {
            if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
            else localStorage.removeItem(REFRESH_KEY);
          }
        },

        tokenHeaderName: "Authorization",
        formatToken: (t) => `Bearer ${t}`,

        doRefresh: async ({ refreshToken }) => {
          const { data } = await axios.post(
            `${base}/auth/refresh`,
            { refresh_token: refreshToken },
            { withCredentials: true }
          );
          return {
            accessToken: data.access_token,
            refreshToken:
              typeof data.refresh_token === "undefined"
                ? undefined
                : data.refresh_token,
          };
        },

        onUnauthorized: () => {
          if (typeof window !== "undefined") {
            localStorage.removeItem(ACCESS_KEY);
            localStorage.removeItem(REFRESH_KEY);
          }
        },
      }),
    [base]
  );

  if (typeof window !== "undefined") {
    api.interceptors.request.use((cfg) => {
      const full = `${api.defaults.baseURL ?? ""}${cfg.url ?? ""}`;
      console.log("➡️", (cfg.method || "get").toUpperCase(), full);
      return cfg;
    });
    console.log("[Admin API] baseURL:", api.defaults.baseURL ?? "(relative)");
    console.log("[Refresh   ] URL    :", `${base}/auth/refresh`);
  }

  return { api, base };
}

/* ========= Context ========= */
type Ctx = {
  loading: boolean;
  error: string | null;
  items: LogRow[];
  refetch: (
    filters?: Partial<{
      q: string;
      level: LogLevel;
      module: string;
      from: string; // ISO
      to: string; // ISO
    }>
  ) => Promise<void>;
};

const AdminLogsContext = createContext<Ctx | null>(null);

/* ========= Provider ========= */
export function AdminLogsProvider({ children }: PropsWithChildren<{}>) {
  const { api } = useAdminApi();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<LogRow[]>([]);

  const normalize = (raw: any): LogRow => ({
    id: String(raw._id ?? raw.id ?? ""),
    timestamp: new Date(raw.timestamp).toISOString(),
    level: raw.level,
    module: raw.module,
    message: raw.message,
    user_id: raw.user_id ?? null,
    request_id: raw.request_id ?? null,
    meta: raw.meta ?? {},
  });

  const refetch = useCallback(
    async (
      filters?: Partial<{
        q: string;
        level: LogLevel;
        module: string;
        from: string;
        to: string;
      }>
    ) => {
      setLoading(true);
      setError(null);
      const t = toast.loading("Loading logs...");
      try {
        const { data } = await api.get("/admin-logs/logs", {
          params: {
            ...(filters?.q ? { q: filters.q } : {}),
            ...(filters?.level ? { level: filters.level } : {}),
            ...(filters?.module ? { module: filters.module } : {}),
            ...(filters?.from ? { from: filters.from } : {}),
            ...(filters?.to ? { to: filters.to } : {}),
          },
        });
        const list = (data?.items ?? []).map(normalize);
        setItems(list);
        toast.success("Logs loaded", { id: t });
      } catch (e: any) {
        const msg =
          e?.response?.data?.error || e?.message || "Failed to load logs";
        setError(msg);
        toast.error(msg, { id: t });
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const value = useMemo(
    () => ({ loading, error, items, refetch }),
    [loading, error, items, refetch]
  );

  return (
    <AdminLogsContext.Provider value={value}>
      {children}
    </AdminLogsContext.Provider>
  );
}

/* ========= Hook ========= */
export function useAdminLogs() {
  const ctx = useContext(AdminLogsContext);
  if (!ctx)
    throw new Error("useAdminLogs must be used within <AdminLogsProvider>");
  return ctx;
}
