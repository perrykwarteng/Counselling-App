// Context/AdminResourcesProvider.tsx
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

/* ========= Types (unchanged) ========= */
export type Resource = {
  id: string;
  title: string;
  description?: string | null;
  file_url?: string | null;
  type?: "video" | "article" | "pdf" | "other";
  uploaded_by?: string | null;
  created_at: string;
  updated_at?: string;
};

export type CreateResourceInput = {
  title: string;
  description?: string | null;
  file_url?: string | null;
  type?: "video" | "article" | "pdf" | "other";
};

export type UpdateResourceInput = Partial<
  Omit<CreateResourceInput, "title">
> & {
  title?: string;
};

type ListItem = {
  _id: string;
  title: string;
  description?: string | null;
  file_url?: string | null;
  type?: "video" | "article" | "pdf" | "other";
  uploaded_by?: string | null;
  created_at: string;
  updated_at?: string;
};

type ListEnvelope = { items: ListItem[] } | ListItem[];

/* ========= Context ========= */
type ResourcesContextValue = {
  apiBase: string | undefined;
  items: Resource[];
  loading: boolean;
  error?: string;
  query: string;
  setQuery: (q: string) => void;

  ensureLoaded: () => Promise<void>; // ← NEW
  refetch: () => Promise<void>;
  getById: (id: string) => Promise<Resource | null>;
  create: (payload: CreateResourceInput) => Promise<Resource | null>;
  update: (
    id: string,
    payload: UpdateResourceInput
  ) => Promise<Resource | null>;
  remove: (id: string) => Promise<boolean>;
};

const ResourcesContext = createContext<ResourcesContextValue | null>(null);
export function useAdminResources() {
  const ctx = useContext(ResourcesContext);
  if (!ctx)
    throw new Error(
      "useAdminResources must be used within <AdminResourcesProvider>"
    );
  return ctx;
}

/* ========= API client ========= */
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
function mapList(arr: ListItem[]): Resource[] {
  return arr.map((r) => ({
    id: r._id,
    title: r.title,
    description: r.description ?? null,
    file_url: r.file_url ?? null,
    type: r.type ?? "other",
    uploaded_by: r.uploaded_by ?? null,
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
  }

  return { api, base, root };
}

type ProviderProps = PropsWithChildren<{}>;

export function AdminResourcesProvider({ children }: ProviderProps) {
  const { api, base } = useAdminApi();

  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [query, setQuery] = useState("");

  const hasLoadedRef = useRef(false);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(undefined);

      const { data } = await api.get<ListEnvelope>(
        "/admin/resources/resources"
      );
      const list = Array.isArray(data) ? data : data?.items ?? [];
      setItems(mapList(list));
    } catch (e) {
      setError(extractError(e));
    } finally {
      setLoading(false);
    }
  }, [api]);

  const ensureLoaded = useCallback(async () => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    await refetch();
  }, [refetch]);

  const getById = useCallback(
    async (id: string) => {
      try {
        setError(undefined);
        const { data } = await api.get<{ resource: ListItem } | ListItem>(
          `/admin/resources/resources/${id}`
        );
        const raw = (data as any).resource ?? data;
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
    async (payload: CreateResourceInput) => {
      try {
        setLoading(true);
        setError(undefined);

        const { data } = await api.post<{ resource: ListItem } | ListItem>(
          "/admin/resources/resources",
          payload
        );

        const raw = (data as any).resource ?? data;
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
    async (id: string, payload: UpdateResourceInput) => {
      try {
        setLoading(true);
        setError(undefined);

        const { data } = await api.patch<{ resource: ListItem } | ListItem>(
          `/admin/resources/resources/${id}`,
          payload
        );
        const raw = (data as any).resource ?? data;
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

  const remove = useCallback(
    async (id: string) => {
      try {
        setError(undefined);
        await api.delete(`/admin/resources/resources/${id}`);
        setItems((prev) => prev.filter((r) => r.id !== id));
        return true;
      } catch (e) {
        setError(extractError(e));
        return false;
      }
    },
    [api]
  );

  const value = useMemo<ResourcesContextValue>(
    () => ({
      apiBase: base,
      items,
      loading,
      error,
      query,
      setQuery,

      ensureLoaded, // ← NEW
      refetch,
      getById,
      create,
      update,
      remove,
    }),
    [
      base,
      items,
      loading,
      error,
      query,
      ensureLoaded,
      refetch,
      getById,
      create,
      update,
      remove,
    ]
  );

  return (
    <ResourcesContext.Provider value={value}>
      {children}
    </ResourcesContext.Provider>
  );
}
