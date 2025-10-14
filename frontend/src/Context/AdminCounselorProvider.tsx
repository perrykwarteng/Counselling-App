"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  PropsWithChildren,
} from "react";
import type { AxiosInstance } from "axios";
import axios from "axios";
import { createApiClient } from "@/lib/http/createApiClient";

/* ========= Types ========= */
type CounselorType = "academic" | "professional";
type StatusFilter = "all" | "active" | "inactive";
type TypeFilter = "all" | CounselorType;

export type Counselor = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  counselor_type: CounselorType;
  is_active: boolean;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CreateCounselorInput = {
  name: string;
  email: string;
  phone?: string;
  counselor_type: CounselorType;
  is_active: boolean;
};

export type UpdateCounselorInput = Partial<
  Omit<Counselor, "id" | "created_at" | "updated_at">
>;

type ListItem = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  counselor_type: CounselorType;
  is_active: boolean;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
};

type ListEnvelope = { items: ListItem[] } | ListItem[];

/* ========= Context ========= */
type AdminContextValue = {
  apiBase: string | undefined;
  counselors: {
    items: Counselor[];
    loading: boolean;
    error?: string;
    query: string;
    typeFilter: TypeFilter;
    statusFilter: StatusFilter;

    setQuery: (q: string) => void;
    setTypeFilter: (t: TypeFilter) => void;
    setStatusFilter: (s: StatusFilter) => void;

    /** Manually (re)load the list */
    refetch: () => Promise<void>;
    /** Lazy one-time loader; no-op if already loaded */
    ensureLoaded: () => Promise<void>;

    create: (payload: CreateCounselorInput) => Promise<Counselor | null>;
    update: (
      id: string,
      payload: UpdateCounselorInput
    ) => Promise<Counselor | null>;
    toggleActive: (id: string, is_active: boolean) => Promise<boolean>;
    remove: (id: string) => Promise<boolean>;
  };
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within <AdminProvider>");
  return ctx;
}
export function useAdminCounselors() {
  return useAdmin().counselors;
}

/* ========= Utils ========= */
const ACCESS_KEY = "auth_access_token";
const REFRESH_KEY = "auth_refresh_token";

const mapToCounselors = (arr: ListItem[]): Counselor[] =>
  arr.map((r) => ({
    id: r._id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    counselor_type: r.counselor_type,
    is_active: r.is_active,
    is_verified: r.is_verified,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));

function extractError(e: any): string {
  return (
    e?.response?.data?.error ??
    e?.response?.data?.message ??
    e?.response?.statusText ??
    e?.message ??
    "Request failed"
  );
}

function useAdminApi(): { api: AxiosInstance; base: string | undefined } {
  const base =
    (process.env.NEXT_PUBLIC_APP_BASE_URL &&
      `${process.env.NEXT_PUBLIC_APP_BASE_URL.replace(/\/$/, "")}`) ||
    "";

  const root =
    (process.env.NEXT_PUBLIC_APP_BASE_URL &&
      process.env.NEXT_PUBLIC_APP_BASE_URL.replace(/\/$/, "")) ||
    "";

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
            `${root}/auth/refresh`,
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
    [base, root]
  );

  if (typeof window !== "undefined") {
    api.interceptors.request.use((cfg) => {
      const full = `${api.defaults.baseURL ?? ""}${cfg.url ?? ""}`;
      console.log("➡️", (cfg.method || "get").toUpperCase(), full);
      return cfg;
    });
    console.log("[Admin API] baseURL:", api.defaults.baseURL ?? "(relative)");
    console.log("[Refresh   ] URL    :", `${root}/auth/refresh`);
  }

  return { api, base };
}

/* ========= Provider ========= */
type ProviderProps = PropsWithChildren<{}>;

export function AdminProvider({ children }: ProviderProps) {
  const { api, base } = useAdminApi();

  const [items, setItems] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // lazy-load control
  const initializedRef = useRef(false);
  const inflightRef = useRef<Promise<void> | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const { data } = await api.get<ListEnvelope>(
        "/admin/counselor/counselors"
      );
      const list = Array.isArray(data) ? data : data?.items ?? [];
      setItems(mapToCounselors(list));
    } catch (e) {
      setError(extractError(e));
    } finally {
      setLoading(false);
    }
  }, [api]);

  /** Only loads once per app lifetime (until reload); safe to call from pages on demand */
  const ensureLoaded = useCallback(async () => {
    if (initializedRef.current) return;
    if (inflightRef.current) return inflightRef.current;

    inflightRef.current = (async () => {
      try {
        await refetch();
      } finally {
        initializedRef.current = true;
        inflightRef.current = null;
      }
    })();

    return inflightRef.current;
  }, [refetch]);

  const create = useCallback(
    async (payload: CreateCounselorInput) => {
      try {
        setLoading(true);
        setError(undefined);

        const { data } = await api.post<{ counselor: ListItem }>(
          "/admin/counselor/counselors",
          payload
        );

        const mapped = mapToCounselors([data.counselor])[0];
        setItems((prev) => [mapped, ...prev]);
        return mapped;
      } catch (e) {
        setError(extractError(e));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const update = useCallback(
    async (id: string, payload: UpdateCounselorInput) => {
      try {
        setLoading(true);
        setError(undefined);

        const { data } = await api.patch<{ counselor: ListItem }>(
          `/admin/counselor/counselors/${id}`,
          payload
        );

        const mapped = mapToCounselors([data.counselor])[0];
        setItems((prev) => prev.map((r) => (r.id === id ? mapped : r)));
        return mapped;
      } catch (e) {
        setError(extractError(e));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const toggleActive = useCallback(
    async (id: string, is_active: boolean) => {
      // optimistic
      setItems((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_active } : r))
      );
      try {
        setError(undefined);
        await api.patch(`/admin/counselor/counselors/${id}/active`, {
          is_active,
        });
        return true;
      } catch (e) {
        // rollback
        setItems((prev) =>
          prev.map((r) => (r.id === id ? { ...r, is_active: !is_active } : r))
        );
        setError(extractError(e));
        return false;
      }
    },
    [api]
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        setError(undefined);
        await api.delete(`/admin/counselor/counselors/${id}`);
        setItems((prev) => prev.filter((r) => r.id !== id));
        return true;
      } catch (e) {
        setError(extractError(e));
        return false;
      }
    },
    [api]
  );

  const counselors = useMemo<AdminContextValue["counselors"]>(
    () => ({
      items,
      loading,
      error,

      query,
      typeFilter,
      statusFilter,

      setQuery,
      setTypeFilter,
      setStatusFilter,

      refetch,
      ensureLoaded,

      create,
      update,
      toggleActive,
      remove,
    }),
    [
      items,
      loading,
      error,
      query,
      typeFilter,
      statusFilter,
      setQuery,
      setTypeFilter,
      setStatusFilter,
      refetch,
      ensureLoaded,
      create,
      update,
      toggleActive,
      remove,
    ]
  );

  const value: AdminContextValue = useMemo(
    () => ({
      apiBase: base,
      counselors,
    }),
    [base, counselors]
  );

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}
