// Context/StudentResourcesProvider.tsx
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import axiosLib, { AxiosError, AxiosInstance } from "axios";

export type ResourceType = "video" | "article" | "pdf" | "other";

export type PublicResource = {
  id: string; // mapped from _id
  title: string;
  description?: string | null;
  file_url?: string | null;
  type?: ResourceType;
  created_at: string;
  updated_at?: string;
};

type ListResponse = {
  items: Array<{
    _id: string;
    title: string;
    description?: string | null;
    file_url?: string | null;
    type?: ResourceType;
    created_at: string;
    updated_at?: string;
  }>;
  total: number;
  page: number;
  pages: number;
};

type RefetchOpts = Partial<{
  page: number;
  query: string;
  typeFilter: "all" | ResourceType;
  sort: "new" | "old";
}>;

type Ctx = {
  items: PublicResource[];
  total: number;
  page: number;
  pages: number;

  loading: boolean;
  error: string | null;

  // filters the page uses
  query: string;
  setQuery: (v: string) => void;

  typeFilter: "all" | ResourceType;
  setTypeFilter: (v: "all" | ResourceType) => void;

  // optional sort if you ever want to expose it in UI later
  sort: "new" | "old";
  setSort: (v: "new" | "old") => void;

  ensureLoaded: () => Promise<void>;
  refetch: (opts?: RefetchOpts) => Promise<void>;
};

const StudentResourcesContext = createContext<Ctx | undefined>(undefined);

function buildAxios(): AxiosInstance {
  const base =
    (process.env.NEXT_PUBLIC_APP_BASE_URL &&
      process.env.NEXT_PUBLIC_APP_BASE_URL.replace(/\/$/, "")) ||
    "";
  return axiosLib.create({
    baseURL: `${base}/resources/resources`,
    withCredentials: true,
  });
}

export function StudentResourcesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const api = useMemo(buildAxios, []);

  // server data
  const [items, setItems] = useState<PublicResource[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // ui state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // filters (names match your page)
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | ResourceType>("all");
  const [sort, setSort] = useState<"new" | "old">("new"); // optional, default newest

  const fetchList = useCallback(
    async (overrides?: RefetchOpts) => {
      setLoading(true);
      setError(null);

      try {
        const q = (overrides?.query ?? query).trim();
        const typeParam =
          (overrides?.typeFilter ?? typeFilter) === "all"
            ? undefined
            : overrides?.typeFilter ?? typeFilter;
        const sortParam = overrides?.sort ?? sort;
        const nextPage = overrides?.page ?? page;

        const { data } = await api.get<ListResponse>("/", {
          params: {
            q: q || undefined,
            type: typeParam,
            sort: sortParam, // "new" | "old" (your controller supports it)
            page: nextPage,
            limit: 12, // tweak per your UX
          },
        });

        const mapped: PublicResource[] = (data.items || []).map((r) => ({
          id: r._id,
          title: r.title,
          description: r.description ?? null,
          file_url: r.file_url ?? null,
          type: (r.type as ResourceType) ?? "other",
          created_at: r.created_at,
          updated_at: r.updated_at,
        }));

        setItems(mapped);
        setTotal(data.total || mapped.length);
        setPages(data.pages || 1);
        setPage(data.page || nextPage);
      } catch (err) {
        const e = err as AxiosError<{ error?: string }>;
        setError(e.response?.data?.error || "Failed to load resources");
      } finally {
        setLoading(false);
      }
    },
    [api, query, typeFilter, sort, page]
  );

  const ensureLoaded = useCallback(async () => {
    if (!items.length && !loading) {
      await fetchList({ page: 1 });
    }
  }, [items.length, loading, fetchList]);

  const refetch: Ctx["refetch"] = useCallback(
    async (opts) => {
      // keep state in sync with overrides the page passes
      if (typeof opts?.query === "string") setQuery(opts.query);
      if (typeof opts?.typeFilter !== "undefined")
        setTypeFilter(opts.typeFilter);
      if (typeof opts?.sort !== "undefined") setSort(opts.sort);
      if (typeof opts?.page === "number") setPage(opts.page);

      await fetchList(opts);
    },
    [fetchList]
  );

  const value: Ctx = {
    items,
    total,
    page,
    pages,

    loading,
    error,

    query,
    setQuery,

    typeFilter,
    setTypeFilter,

    sort,
    setSort,

    ensureLoaded,
    refetch,
  };

  return (
    <StudentResourcesContext.Provider value={value}>
      {children}
    </StudentResourcesContext.Provider>
  );
}

export function useStudentResources() {
  const ctx = useContext(StudentResourcesContext);
  if (!ctx)
    throw new Error(
      "useStudentResources must be used within StudentResourcesProvider"
    );
  return ctx;
}
