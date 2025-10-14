// Context/AppointmentProviders.tsx
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  PropsWithChildren,
  useRef,
} from "react";
import type { AxiosInstance } from "axios";
import axios from "axios";
import { createApiClient } from "@/lib/http/createApiClient";

/* ========= Types ========= */
export type AppointmentMode = "chat" | "video" | "in-person";
export type AppointmentStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "completed";

export type Appointment = {
  _id: string; // Mongo _id for appointments only
  student_id: string; // string/uuid (auth sub or model id)
  counselor_id: string; // string/uuid from Counselor API (_id)
  scheduled_at: string;
  mode: AppointmentMode;
  status?: AppointmentStatus;
  referral_id?: string | null;
  in_person_location?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateAppointmentInput = {
  counselor_id: string;
  scheduled_at: string;
  mode: AppointmentMode;
  referral_id?: string;
  in_person_location?: string;
  notes?: string;
  is_anonymous?: boolean;
};

export type UpdateAppointmentStatusInput = {
  id: string;
  status: AppointmentStatus;
};

export type Counselor = {
  id: string; // use API's id/uuid (e.g., "_id": "a48e1468-...")
  name: string;
  counselor_type?: string | null; // "professional" | "peer" | etc.
};

/* ========= Context ========= */
export type AppointmentContextValue = {
  // appointments
  appointments: Appointment[];
  current?: Appointment | null;
  loadingList: boolean;
  loadingCreate: boolean;
  error?: string;

  listMyAppointments: () => Promise<void>;
  getAppointment: (id: string) => Promise<Appointment | null>;
  createAppointment: (
    payload: CreateAppointmentInput
  ) => Promise<Appointment | null>;
  updateAppointmentStatus: (
    payload: UpdateAppointmentStatusInput
  ) => Promise<Appointment | null>;

  // counselors
  counselors: Counselor[];
  loadingCounselors: boolean;
  counselorError?: string | null;
  listCounselors: () => Promise<void>;

  // lazy loaders
  ensureAppointmentsLoaded: () => Promise<void>;
  ensureCounselorsLoaded: () => Promise<void>;
  ensureAllLoaded: () => Promise<void>;
};

const AppointmentContext = createContext<AppointmentContextValue | null>(null);

export function useAppointments() {
  const ctx = useContext(AppointmentContext);
  if (!ctx) {
    throw new Error(
      "useAppointments must be used inside <AppointmentProvider>"
    );
  }
  return ctx;
}

/* ========= Utils ========= */
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

function useAppointmentApi(): { api: AxiosInstance } {
  const base = (process.env.NEXT_PUBLIC_APP_BASE_URL ?? "").replace(/\/$/, "");
  const root = base;

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

  return { api };
}

/* ========= Provider ========= */
export function AppointmentProvider({ children }: PropsWithChildren<{}>) {
  const { api } = useAppointmentApi();

  // appointments state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [current, setCurrent] = useState<Appointment | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [error, setError] = useState<string>();

  // counselors state
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loadingCounselors, setLoadingCounselors] = useState(false);
  const [counselorError, setCounselorError] = useState<string | null>(null);

  // refs to track init + inflight calls
  const apptsInitRef = useRef(false);
  const apptsInflightRef = useRef<Promise<void> | null>(null);
  const counselorsInitRef = useRef(false);
  const counselorsInflightRef = useRef<Promise<void> | null>(null);

  const sortByScheduledDesc = (arr: Appointment[]) =>
    [...arr].sort(
      (a, b) =>
        new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
    );

  // ===== Appointments API =====
  const listMyAppointments = useCallback(async () => {
    try {
      setLoadingList(true);
      setError(undefined);
      const { data } = await api.get<Appointment[]>(
        `/appointments/appointments`
      );
      setAppointments(sortByScheduledDesc(data));
    } catch (e) {
      setError(extractError(e));
    } finally {
      setLoadingList(false);
    }
  }, [api]);

  const getAppointment = useCallback(
    async (id: string) => {
      try {
        const { data } = await api.get<Appointment>(
          `/appointments/appointments/${id}`
        );
        setCurrent(data);
        setAppointments((prev) => {
          const map = new Map(prev.map((p) => [p._id, p]));
          map.set(data._id, data);
          return sortByScheduledDesc(Array.from(map.values()));
        });
        return data;
      } catch (e) {
        setError(extractError(e));
        return null;
      }
    },
    [api]
  );

  const createAppointment = useCallback(
    async (payload: CreateAppointmentInput) => {
      try {
        setLoadingCreate(true);
        setError(undefined);
        const { data } = await api.post<Appointment>(
          `/appointments/appointments`,
          payload
        );
        setAppointments((prev) => sortByScheduledDesc([data, ...prev]));
        setCurrent(data);
        return data;
      } catch (e) {
        setError(extractError(e));
        return null;
      } finally {
        setLoadingCreate(false);
      }
    },
    [api]
  );

  const updateAppointmentStatus = useCallback(
    async ({ id, status }: UpdateAppointmentStatusInput) => {
      setAppointments((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status } : a))
      );
      setCurrent((prev) => (prev?._id === id ? { ...prev, status } : prev));

      try {
        const { data } = await api.patch<Appointment>(
          `/appointments/appointments/${id}/status`,
          { status }
        );
        setAppointments((prev) => prev.map((a) => (a._id === id ? data : a)));
        setCurrent((prev) => (prev?._id === id ? data : prev));
        return data;
      } catch (e) {
        await getAppointment(id); // rollback via refetch
        setError(extractError(e));
        return null;
      }
    },
    [api, getAppointment]
  );

  const listCounselors = useCallback(async () => {
    try {
      setLoadingCounselors(true);
      setCounselorError(null);

      const { data } = await api.get<any>(`/admin/counselor/counselors`);
      const arr = Array.isArray(data) ? data : data?.items ?? [];
      const mapped: Counselor[] = arr
        .map((c: any) => ({
          id: String(c?._id ?? c?.id ?? c?.user_id ?? c?.counselor_id ?? ""),
          name: String(c?.name ?? c?.full_name ?? "Unknown"),
          counselor_type:
            typeof c?.counselor_type === "string" ? c.counselor_type : null,
        }))
        .filter((c: Counselor) => !!c.id);

      setCounselors(mapped);
    } catch (e) {
      setCounselorError(extractError(e));
    } finally {
      setLoadingCounselors(false);
    }
  }, [api]);

  // ===== Lazy loaders =====
  const ensureAppointmentsLoaded = useCallback(async () => {
    if (!apptsInitRef.current) {
      if (!apptsInflightRef.current) {
        apptsInflightRef.current = listMyAppointments().finally(() => {
          apptsInitRef.current = true;
          apptsInflightRef.current = null;
        });
      }
      return apptsInflightRef.current;
    }
  }, [listMyAppointments]);

  const ensureCounselorsLoaded = useCallback(async () => {
    if (!counselorsInitRef.current) {
      if (!counselorsInflightRef.current) {
        counselorsInflightRef.current = listCounselors().finally(() => {
          counselorsInitRef.current = true;
          counselorsInflightRef.current = null;
        });
      }
      return counselorsInflightRef.current;
    }
  }, [listCounselors]);

  const ensureAllLoaded = useCallback(async () => {
    await Promise.all([ensureAppointmentsLoaded(), ensureCounselorsLoaded()]);
  }, [ensureAppointmentsLoaded, ensureCounselorsLoaded]);

  /* ===== Value ===== */
  const value: AppointmentContextValue = useMemo(
    () => ({
      appointments,
      current,
      loadingList,
      loadingCreate,
      error,

      listMyAppointments,
      getAppointment,
      createAppointment,
      updateAppointmentStatus,

      counselors,
      loadingCounselors,
      counselorError,
      listCounselors,

      ensureAppointmentsLoaded,
      ensureCounselorsLoaded,
      ensureAllLoaded,
    }),
    [
      appointments,
      current,
      loadingList,
      loadingCreate,
      error,
      listMyAppointments,
      getAppointment,
      createAppointment,
      updateAppointmentStatus,
      counselors,
      loadingCounselors,
      counselorError,
      listCounselors,
      ensureAppointmentsLoaded,
      ensureCounselorsLoaded,
      ensureAllLoaded,
    ]
  );

  return (
    <AppointmentContext.Provider value={value}>
      {children}
    </AppointmentContext.Provider>
  );
}
