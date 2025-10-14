"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useRef,
  PropsWithChildren,
} from "react";
import { toast } from "sonner";
import axios, { AxiosInstance } from "axios";
import { createApiClient } from "@/lib/http/createApiClient";

/* ========= Types ========= */
export type Role = "student" | "counselor" | "admin";
export type CounselorType = "academic" | "professional" | null;

export type IUser = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  counselor_type?: CounselorType;
  availability?: string[];
  specialities?: string[];
  is_verified: boolean;
  is_anonymous: boolean;
  is_active: boolean;
  avatar_url?: string;
  profile?: { department?: string; level?: string };
  created_at: string;
  updated_at: string;
};

export type ReferredStudentRow = {
  student: IUser | null;
  counselor: IUser | null;
  referred_by: string;
  reason?: string | null;
  created_at: string;
};

export type CounselorLoadRow = {
  counselor: IUser | null;
  total_assigned: number;
};

export type ReferralHistoryRow = {
  _id: string;
  student_id: string;
  counselor_id: string;
  referred_by: string;
  reason?: string | null;
  created_at: string;
  counselor?: IUser | null;
  referred_by_user?: IUser | null;
};

/* ========= Filters ========= */
type DeptFilter = "all" | string;
type CounselorFilter = "all" | string;

/* ========= Context shape ========= */
type AdminReferralContextValue = {
  apiBase: string | undefined;
  referrals: {
    // filtered list of latest assignment per student
    items: ReferredStudentRow[];

    // raw server lists
    assigned: ReferredStudentRow[];
    counselors: CounselorLoadRow[];
    unassigned: IUser[];

    // loading / error
    loading: boolean;
    error?: string;

    // filters
    query: string;
    deptFilter: DeptFilter;
    counselorFilter: CounselorFilter;

    setQuery: (q: string) => void;
    setDeptFilter: (d: DeptFilter) => void;
    setCounselorFilter: (c: CounselorFilter) => void;

    // actions
    refetch: () => Promise<void>;
    ensureLoaded: () => Promise<void>;

    refer: (
      studentId: string,
      counselorId: string,
      reason?: string
    ) => Promise<boolean>;
    history: (studentId: string) => Promise<ReferralHistoryRow[]>;
  };
};

const AdminReferralContext = createContext<AdminReferralContextValue | null>(
  null
);

function normalizeText(v: unknown) {
  return (String(v ?? "") || "").toLowerCase();
}

/* ========= Local API hook ========= */
const ACCESS_KEY = "auth_access_token";
const REFRESH_KEY = "auth_refresh_token";

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

export function AdminReferralProvider({ children }: ProviderProps) {
  const { api, base: apiBase } = useAdminApi();

  // server state
  const [assigned, setAssigned] = useState<ReferredStudentRow[]>([]);
  const [counselorLoads, setCounselorLoads] = useState<CounselorLoadRow[]>([]);
  const [unassigned, setUnassigned] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  // filters
  const [query, setQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState<DeptFilter>("all");
  const [counselorFilter, setCounselorFilter] =
    useState<CounselorFilter>("all");

  // lazy-load guards
  const initializedRef = useRef(false);
  const inflightRef = useRef<Promise<void> | null>(null);

  const refetch = useCallback(async () => {
    const t = toast.loading("Loading referrals...");
    try {
      setLoading(true);
      setError(undefined);

      const [s, c, u] = await Promise.all([
        api.get("/admin/referrals/students"),
        api.get("/admin/referrals/counselors"),
        api.get("/admin/referrals/unassigned-students"),
      ]);

      setAssigned(s.data?.items ?? []);
      setCounselorLoads(c.data?.items ?? []);
      setUnassigned(u.data?.items ?? []);
      toast.success("Referrals loaded", { id: t });
    } catch (e: any) {
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        "Failed to load referral data";
      setError(msg);
      toast.error(msg, { id: t });
    } finally {
      setLoading(false);
    }
  }, [api]);

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

  const refer = useCallback(
    async (studentId: string, counselorId: string, reason?: string) => {
      const t = toast.loading("Creating referral...");
      try {
        const { data } = await api.post("/admin/referrals/refer-student", {
          student_id: studentId,
          counselor_id: counselorId,
          reason,
        });
        if (data?.ok) {
          await refetch();
          toast.success("Referral created", { id: t });
          return true;
        }
        toast.error("Failed to create referral", { id: t });
        return false;
      } catch (e: any) {
        const msg =
          e?.response?.data?.error ||
          e?.response?.data?.message ||
          e?.message ||
          "Failed to create referral";
        toast.error(msg, { id: t });
        return false;
      }
    },
    [api, refetch]
  );

  const history = useCallback(
    async (studentId: string): Promise<ReferralHistoryRow[]> => {
      try {
        const res = await api.get(
          `/admin/referrals/referral-history/${studentId}`
        );
        return res.data?.items ?? [];
      } catch (e: any) {
        const msg =
          e?.response?.data?.error ||
          e?.response?.data?.message ||
          e?.message ||
          "Failed to fetch referral history";
        toast.error(msg);
        return [];
      }
    },
    [api]
  );

  // filtering for assigned rows
  const items = useMemo(() => {
    const q = normalizeText(query);

    return assigned
      .filter((row) => {
        // dept filter -> student's department
        if (deptFilter !== "all") {
          const dep = row.student?.profile?.department || "";
          if (dep !== deptFilter) return false;
        }
        // counselor filter -> counselor id
        if (counselorFilter !== "all") {
          const cid = row.counselor?._id || "";
          if (cid !== counselorFilter) return false;
        }
        if (!q) return true;

        // query matches: student/counselor name/email/phone + department/level + reason
        const hay = [
          row.student?.name,
          row.student?.email,
          row.student?.phone,
          row.student?.profile?.department,
          row.student?.profile?.level,
          row.counselor?.name,
          row.counselor?.email,
          row.reason,
        ]
          .map(normalizeText)
          .join(" ");

        return hay.includes(q);
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }, [assigned, query, deptFilter, counselorFilter]);

  const value: AdminReferralContextValue = useMemo(
    () => ({
      apiBase,
      referrals: {
        items,
        assigned,
        counselors: counselorLoads,
        unassigned,
        loading,
        error,

        query,
        deptFilter,
        counselorFilter,

        setQuery,
        setDeptFilter,
        setCounselorFilter,

        refetch,
        ensureLoaded, // 👈 expose lazy loader

        refer,
        history,
      },
    }),
    [
      apiBase,
      items,
      assigned,
      counselorLoads,
      unassigned,
      loading,
      error,
      query,
      deptFilter,
      counselorFilter,
      refetch,
      ensureLoaded,
      refer,
      history,
    ]
  );

  return (
    <AdminReferralContext.Provider value={value}>
      {children}
    </AdminReferralContext.Provider>
  );
}

/* ========= Hooks ========= */
export function useAdminReferralsRoot() {
  const ctx = useContext(AdminReferralContext);
  if (!ctx)
    throw new Error(
      "useAdminReferralsRoot must be used within <AdminReferralProvider>"
    );
  return ctx;
}

export function useAdminReferrals() {
  return useAdminReferralsRoot().referrals;
}
