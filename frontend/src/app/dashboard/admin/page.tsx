"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminSidebar } from "@/components/adminSidebar/AdminSidebar";

/* UI */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* Icons */
import {
  Users,
  UserCheck,
  Activity,
  Shield,
  TrendingUp,
  BookOpen,
  FileText,
} from "lucide-react";

/* Live data hooks */
import { useAdminStudents } from "@/Context/AdminStudentrProvider";
import { useAdminCounselors } from "@/Context/AdminCounselorProvider";
import { useAdminReferrals } from "@/Context/AdminReferralsProvider";
import { useAdminResources } from "@/Context/AdminResourcesProvider";
import { useAdminLogs } from "@/Context/AdminLogsProvider";

/* Charts (Recharts) */
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

/* ============ small UI helpers ============ */
function StatValue({
  value,
  loading,
  className = "",
}: {
  value: string | number;
  loading?: boolean;
  className?: string;
}) {
  if (loading) {
    return <div className="h-7 w-16 rounded-md bg-muted animate-pulse" />;
  }
  return <div className={`text-2xl font-bold ${className}`}>{value}</div>;
}

function RowSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="h-4 w-40 bg-muted animate-pulse rounded" />
      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
    </div>
  );
}

/* ============ chart helpers ============ */
const CHART_COLORS = [
  "#3b82f6", // blue-500
  "#22c55e", // green-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#a855f7", // purple-500
  "#06b6d4", // cyan-500
];

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleString(undefined, { month: "short" });
}

function lastNMonthKeys(n = 6) {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(monthKey(d));
  }
  return out;
}

function safeDate(v: any): Date | null {
  try {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/* ============ page ============ */
export default function AdminDashboard() {
  const router = useRouter();

  /* ===== Students ===== */
  const {
    items: studentItems,
    loading: studentsLoading,
    ensureLoaded: ensureStudents,
  } = useAdminStudents();

  /* ===== Counselors ===== */
  const {
    items: counselorItems,
    loading: counselorsLoading,
    ensureLoaded: ensureCounselors,
  } = useAdminCounselors();

  /* ===== Referrals ===== */
  const {
    items: referralCurrent, // latest assignment per student
    counselors: counselorLoads,
    loading: referralsLoading,
    ensureLoaded: ensureReferrals,
  } = useAdminReferrals();

  /* ===== Resources ===== */
  const {
    items: resourceItems,
    loading: resourcesLoading,
    ensureLoaded: ensureResources,
  } = useAdminResources();

  /* ===== Logs ===== */
  const {
    items: logItems,
    loading: logsLoading,
    ensureLoaded: ensureLogs,
  } = useAdminLogs();

  // Load everything once on page mount (idempotent in providers)
  useEffect(() => {
    void Promise.all([
      ensureStudents?.(),
      ensureCounselors?.(),
      ensureReferrals?.(),
      ensureResources?.(),
      ensureLogs?.(),
    ]);
  }, [
    ensureStudents,
    ensureCounselors,
    ensureReferrals,
    ensureResources,
    ensureLogs,
  ]);

  /* ===== Derived stats ===== */
  const totalStudents = studentItems.length;
  const activeCounselors = useMemo(
    () => counselorItems.filter((c) => c.is_active).length,
    [counselorItems]
  );
  const totalReferrals = referralCurrent.length;
  const totalResources = resourceItems.length;
  const recentLogs = useMemo(() => logItems.slice(0, 5), [logItems]);

  const errorCount = useMemo(
    () => logItems.filter((l: any) => l.level === "error").length,
    [logItems]
  );
  const healthLabel =
    errorCount === 0 ? "Healthy" : errorCount <= 3 ? "Degraded" : "Attention";

  const isLoadingAny =
    studentsLoading ||
    counselorsLoading ||
    referralsLoading ||
    resourcesLoading ||
    logsLoading;

  const trendData = useMemo(() => {
    const months = lastNMonthKeys(6);
    const studentCount: Record<string, number> = Object.fromEntries(
      months.map((k) => [k, 0])
    );
    const referralCount: Record<string, number> = Object.fromEntries(
      months.map((k) => [k, 0])
    );

    studentItems.forEach((s: any) => {
      const d = safeDate(s.created_at);
      if (!d) return;
      const k = monthKey(d);
      if (k in studentCount) studentCount[k] += 1;
    });

    referralCurrent.forEach((r: any) => {
      const d = safeDate(r.created_at);
      if (!d) return;
      const k = monthKey(d);
      if (k in referralCount) referralCount[k] += 1;
    });

    return months.map((k) => ({
      month: monthLabel(k),
      Students: studentCount[k] ?? 0,
      Referrals: referralCount[k] ?? 0,
    }));
  }, [studentItems, referralCurrent]);

  // 2) Counselor load: top 8 by total_assigned
  const counselorBarData = useMemo(() => {
    const arr = [...counselorLoads]
      .sort((a, b) => (b.total_assigned ?? 0) - (a.total_assigned ?? 0))
      .slice(0, 8)
      .map((r) => ({
        name: r.counselor?.name ?? "Unknown",
        Assigned: r.total_assigned ?? 0,
      }));
    return arr;
  }, [counselorLoads]);

  // 3) Resources by type (pie)
  const resourcePieData = useMemo(() => {
    const counts: Record<string, number> = {};
    resourceItems.forEach((r) => {
      const t = r.type ?? "other";
      counts[t] = (counts[t] ?? 0) + 1;
    });
    const ordered: Array<{ name: string; value: number }> = [
      { name: "article", value: counts["article"] ?? 0 },
      { name: "video", value: counts["video"] ?? 0 },
      { name: "pdf", value: counts["pdf"] ?? 0 },
      { name: "other", value: counts["other"] ?? 0 },
    ].filter((d) => d.value > 0);
    return ordered.length ? ordered : [{ name: "none", value: 1 }];
  }, [resourceItems]);

  return (
    <DashboardLayout title="Admin Dashboard" sidebar={<AdminSidebar />}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Students
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <StatValue value={totalStudents} loading={studentsLoading} />
              <CardDescription className="mt-1">
                <Button asChild variant="link" className="px-0 text-xs">
                  <Link href="/admin/students">Manage students</Link>
                </Button>
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Counselors
              </CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <StatValue value={activeCounselors} loading={counselorsLoading} />
              <CardDescription className="mt-1">
                <Button asChild variant="link" className="px-0 text-xs">
                  <Link href="/admin/counselors">Manage counselors</Link>
                </Button>
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Current Referrals
              </CardTitle>
              <Activity className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <StatValue value={totalReferrals} loading={referralsLoading} />
              <CardDescription className="mt-1">
                <Button asChild variant="link" className="px-0 text-xs">
                  <Link href="/admin/referrals">View referrals</Link>
                </Button>
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                System Health
              </CardTitle>
              <Shield className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <StatValue
                value={healthLabel}
                loading={logsLoading}
                className={
                  healthLabel === "Healthy"
                    ? "text-green-600"
                    : healthLabel === "Degraded"
                    ? "text-amber-600"
                    : "text-red-600"
                }
              />
              <CardDescription className="mt-1">
                {logsLoading ? "Checking…" : `${errorCount} error(s) today`}
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Charts row 1: Trends + Counselor Load */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trends */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" />
                Trends — Students & Referrals (Last 6 Months)
              </CardTitle>
              <CardDescription>Monthly totals</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {studentsLoading && referralsLoading ? (
                <div className="h-full w-full rounded-lg bg-muted animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendData}
                    margin={{ top: 8, right: 16, left: -8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="Students"
                      stroke={CHART_COLORS[0]}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="Referrals"
                      stroke={CHART_COLORS[2]}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Counselor Load */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4" />
                Counselor Load (Top 8)
              </CardTitle>
              <CardDescription>Current assigned students</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {referralsLoading ? (
                <div className="h-full w-full rounded-lg bg-muted animate-pulse" />
              ) : counselorBarData.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No referral data yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={counselorBarData}
                    margin={{ top: 8, right: 16, left: -24, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      interval={0}
                      height={50}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar
                      dataKey="Assigned"
                      fill={CHART_COLORS[1]}
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts row 2: Resources Pie + Snapshots */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resources pie */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4" />
                Resources by Type
              </CardTitle>
              <CardDescription>Total: {totalResources}</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {resourcesLoading ? (
                <div className="h-full w-full rounded-lg bg-muted animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={resourcePieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {resourcePieData.map((entry, i) => (
                        <Cell
                          key={`slice-${i}`}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="pt-3">
                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl w-full sm:w-auto"
                >
                  <Link href="/admin/resources">Manage resources</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Referrals snapshot */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" />
                Referral Load (Top Counselors)
              </CardTitle>
              <CardDescription>
                Most assigned counselors (current)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {referralsLoading ? (
                <>
                  <RowSkeleton />
                  <RowSkeleton />
                  <RowSkeleton />
                </>
              ) : counselorLoads.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No referrals yet.
                </div>
              ) : (
                counselorLoads
                  .slice(0, 6)
                  .sort(
                    (a, b) => (b.total_assigned ?? 0) - (a.total_assigned ?? 0)
                  )
                  .map((r, i) => (
                    <div
                      key={r.counselor?._id || i}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="truncate">
                        <div className="font-medium truncate">
                          {r.counselor?.name ?? "Unknown counselor"}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {r.counselor?.email ?? "—"}
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {r.total_assigned ?? 0} assigned
                      </Badge>
                    </div>
                  ))
              )}
              <div className="pt-2">
                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl w-full sm:w-auto"
                >
                  <Link href="/admin/referrals">Open referrals</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logs snapshot */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Recent System Logs
            </CardTitle>
            <CardDescription>Newest 5 entries</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {logsLoading ? (
              <>
                <RowSkeleton />
                <RowSkeleton />
                <RowSkeleton />
              </>
            ) : recentLogs.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No logs available.
              </div>
            ) : (
              recentLogs.map((l: any, idx: number) => (
                <div
                  key={l.id ?? idx}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="truncate">
                    <div className="font-medium truncate">{l.message}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {l.module ?? "system"} •{" "}
                      {new Date(l.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      l.level === "error"
                        ? "border-red-500 text-red-700"
                        : l.level === "warn"
                        ? "border-amber-500 text-amber-700"
                        : l.level === "audit"
                        ? "border-emerald-500 text-emerald-700"
                        : "border-blue-500 text-blue-700"
                    }
                  >
                    {l.level}
                  </Badge>
                </div>
              ))
            )}
            <div className="pt-2">
              <Button
                asChild
                variant="outline"
                className="rounded-xl w-full sm:w-auto"
              >
                <Link href="/admin/logs">Open logs</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
