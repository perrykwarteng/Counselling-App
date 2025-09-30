"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  PropsWithChildren,
} from "react";
import type { AxiosInstance } from "axios";
import axios from "axios"; // only used for absolute refresh call
import { createApiClient } from "@/lib/http/createApiClient";

/* ========= Types ========= */
export type Student = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  is_verified: boolean;
  is_anonymous: boolean;
  /** Flattened for UI convenience */
  department?: string | null;
  level?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
};

/** Backend expects nested profile */
export type CreateStudentInput = {
  name: string;
  email: string;
  phone?: string;
  is_verified: boolean;
  is_anonymous: boolean;
  profile?: {
    department?: string | null;
    level?: string | null;
  };
  is_active: boolean;
};

export type UpdateStudentInput = Partial<
  Omit<Student, "id" | "created_at" | "updated_at" | "department" | "level">
> & {
  profile?: {
    department?: string | null;
    level?: string | null;
  };
};

/** Raw API item */
type ListItem = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  is_verified: boolean;
  is_anonymous: boolean;
  profile?: {
    department?: string | null;
    level?: string | null;
  };
  is_active: boolean;
  created_at: string;
  updated_at?: string;
};

type ListEnvelope = { items: ListItem[] } | ListItem[];

/* ========= Context ========= */
type StudentsContextValue = {
  apiBase: string | undefined;
  items: Student[];
  loading: boolean;
  error?: string;

  query: string;
  setQuery: (q: string) => void;

  refetch: () => Promise<void>;
  getById: (id: string) => Promise<Student | null>;
  create: (payload: CreateStudentInput) => Promise<Student | null>;
  update: (id: string, payload: UpdateStudentInput) => Promise<Student | null>;
  toggleActive: (id: string, is_active: boolean) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
};

const StudentsContext = createContext<StudentsContextValue | null>(null);

export function useAdminStudents() {
  const ctx = useContext(StudentsContext);
  if (!ctx)
    throw new Error(
      "useAdminStudents must be used within <AdminStudentsProvider>"
    );
  return ctx;
}

/* ========= Auth / API client ========= */
const ACCESS_KEY = "auth_access_token";
const REFRESH_KEY = "auth_refresh_token";

function extractError(e: any): string {
  return (
    e?.response?.data?.error ??
    e?.response?.data?.message ??
    e?.response?.statusText ??
    e?.message ??
    "Request failed"
  );
}

/** Map raw API items (with nested profile) to flattened Student for UI */
function mapList(arr: ListItem[]): Student[] {
  return arr.map((r) => ({
    id: r._id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    is_verified: r.is_verified,
    is_anonymous: r.is_anonymous,
    department: r.profile?.department ?? null,
    level: r.profile?.level ?? null,
    is_active: r.is_active,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

function useAdminApi(): {
  api: AxiosInstance;
  base: string | undefined;
  root: string;
} {
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
    console.log(
      "[Students API] baseURL:",
      api.defaults.baseURL ?? "(relative)"
    );
    console.log("[Refresh     ] URL    :", `${root}/auth/refresh`);
  }

  return { api, base, root };
}

/* ========= Provider ========= */
/**
 * Endpoints:
 * GET    /admin-student/students
 * GET    /admin-student/students/:id
 * POST   /admin-student/students                 (expects { ..., profile: { ... } })
 * PATCH  /admin-student/students/:id             (allows partial; include profile if changing)
 * PATCH  /admin-student/students/:id/active      ({ is_active })
 * DELETE /admin-student/students/:id
 */
type ProviderProps = PropsWithChildren<{}>;

export function AdminStudentsProvider({ children }: ProviderProps) {
  const { api, base } = useAdminApi();

  const [items, setItems] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [query, setQuery] = useState("");

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(undefined);

      const { data } = await api.get<ListEnvelope>("/admin-student/students");
      const list = Array.isArray(data) ? data : data?.items ?? [];
      setItems(mapList(list));
    } catch (e) {
      setError(extractError(e));
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const getById = useCallback(
    async (id: string) => {
      try {
        setError(undefined);
        const { data } = await api.get<{ student: ListItem } | ListItem>(
          `/admin-student/students/${id}`
        );
        const raw = (data as any).student ?? data;
        if (!raw) return null;
        return mapList([raw])[0];
      } catch (e) {
        setError(extractError(e));
        return null;
      }
    },
    [api]
  );

  const create = useCallback(
    async (payload: CreateStudentInput) => {
      try {
        setLoading(true);
        setError(undefined);

        const { data } = await api.post<{ student: ListItem } | ListItem>(
          "/admin-student/students",
          payload
        );

        const raw = (data as any).student ?? data;
        const mapped = mapList([raw])[0];
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
    async (id: string, payload: UpdateStudentInput) => {
      try {
        setLoading(true);
        setError(undefined);

        const { data } = await api.patch<{ student: ListItem } | ListItem>(
          `/admin-student/students/${id}`,
          payload
        );
        const raw = (data as any).student ?? data;
        const mapped = mapList([raw])[0];
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
        await api.patch(`/admin-student/students/${id}/active`, { is_active });
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
        await api.delete(`/admin-student/students/${id}`);
        setItems((prev) => prev.filter((r) => r.id !== id));
        return true;
      } catch (e) {
        setError(extractError(e));
        return false;
      }
    },
    [api]
  );

  const value = useMemo<StudentsContextValue>(
    () => ({
      apiBase: base,
      items,
      loading,
      error,
      query,
      setQuery,
      refetch,
      getById,
      create,
      update,
      toggleActive,
      remove,
    }),
    [
      base,
      items,
      loading,
      error,
      query,
      setQuery,
      refetch,
      getById,
      create,
      update,
      toggleActive,
      remove,
    ]
  );

  return (
    <StudentsContext.Provider value={value}>
      {children}
    </StudentsContext.Provider>
  );
}
