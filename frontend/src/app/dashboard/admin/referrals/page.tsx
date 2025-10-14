"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  UserPlus,
  CheckCircle,
  User,
  FileText,
  AlertCircle,
  RotateCw,
  TrendingUp,
  Users,
} from "lucide-react";
import { AdminSidebar } from "@/components/adminSidebar/AdminSidebar";
import { toast } from "sonner";

// hook from provider
import { useAdminReferrals } from "@/Context/AdminReferralsProvider";

/* ---------- Local tiny helpers ---------- */
type Role = "student" | "counselor" | "admin";
type CounselorType = "academic" | "professional" | null;

type IUser = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  counselor_type?: CounselorType;
  specialities?: string[];
  is_verified: boolean;
  is_anonymous: boolean;
  is_active: boolean;
  profile?: { department?: string; level?: string };
  created_at: string;
};

type ReferredStudentRow = {
  referred_by: string;
  reason?: string | null;
  created_at: string;
  student: IUser | null;
  counselor: IUser | null;
};

type CounselorLoadRow = {
  total_assigned: number;
  counselor: IUser | null;
};

const initials = (n?: string) =>
  (n || "")
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

const fmtDateTime = (iso?: string) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
};

/* ---------- Stat card + progress ---------- */
function StatCard({
  title,
  icon,
  value,
  hint,
  loading = false,
  accent = "default",
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  value: React.ReactNode;
  hint?: string;
  loading?: boolean;
  accent?: "default" | "green" | "blue" | "indigo" | "amber";
  children?: React.ReactNode;
}) {
  const accentMap: Record<string, string> = {
    default: "",
    green: "text-green-600",
    blue: "text-blue-600",
    indigo: "text-indigo-600",
    amber: "text-amber-600",
  };
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-20 rounded-md bg-muted animate-pulse" />
        ) : (
          <div className={`text-2xl font-bold ${accentMap[accent]}`}>
            {value}
          </div>
        )}
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
        {children}
      </CardContent>
    </Card>
  );
}

function MiniProgress({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="mt-3">
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary"
          style={{ width: `${clamped}%`, transition: "width .3s ease" }}
        />
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">{clamped}%</div>
    </div>
  );
}

export default function AdminReferralsPage() {
  const router = useRouter();

  const {
    items: assignedRows,
    counselors: counselorLoads,
    unassigned,
    loading,
    error,
    refetch,
    refer,
    ensureLoaded, // 👈 idempotent, only loads when this page mounts
  } = useAdminReferrals();

  // 🔁 load on page mount only
  useEffect(() => {
    void ensureLoaded();
  }, [ensureLoaded]);

  // Dialog + form state
  const [showCreateReferral, setShowCreateReferral] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toCounselorId, setToCounselorId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Student options = union of assigned + unassigned
  const allStudentsForSelect = useMemo(() => {
    const fromAssigned = (assignedRows || [])
      .map((r) => r.student)
      .filter(Boolean) as IUser[];
    const byId = new Map<string, IUser>();
    [...fromAssigned, ...(unassigned || [])].forEach((s) => {
      if (!byId.has(s._id)) byId.set(s._id, s);
    });
    return Array.from(byId.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [assignedRows, unassigned]);

  // Counselors from loads + assigned
  const counselorOptions = useMemo(() => {
    const fromLoads = (counselorLoads || [])
      .map((c) => c.counselor)
      .filter(Boolean) as IUser[];
    const fromAssigned = (assignedRows || [])
      .map((r) => r.counselor)
      .filter(Boolean) as IUser[];
    const byId = new Map<string, IUser>();
    [...fromLoads, ...fromAssigned].forEach((u) => {
      if (u.role === "counselor" && !byId.has(u._id)) byId.set(u._id, u);
    });
    return Array.from(byId.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [counselorLoads, assignedRows]);

  async function handleRefresh() {
    const t = toast.loading("Refreshing...");
    try {
      await refetch();
      setLastUpdated(new Date().toISOString());
      toast.success("List refreshed", { id: t });
    } catch {
      toast.error("Failed to refresh", { id: t });
    }
  }

  async function handleCreateReferral() {
    setBusy(true);
    const t = toast.loading("Creating referral...");
    try {
      const composedReason =
        notes.trim().length > 0
          ? `${reason.trim()}\n\nNotes:\n${notes.trim()}`
          : reason.trim();
      const ok = await refer(studentId, toCounselorId, composedReason);
      if (!ok) throw new Error("Refer API returned false");
      toast.success("Referral created", { id: t });
      setToCounselorId("");
      setStudentId("");
      setReason("");
      setNotes("");
      setShowCreateReferral(false);
      setLastUpdated(new Date().toISOString());
    } catch (e: any) {
      toast.error(e?.message || "Failed to create referral", { id: t });
    } finally {
      setBusy(false);
    }
  }

  /* ---------- Derived stats for the cards ---------- */
  const totalAssigned = assignedRows?.length ?? 0;
  const totalUnassigned = unassigned?.length ?? 0;
  const totalCounselors = counselorLoads?.length ?? 0;
  const totalStudents = totalAssigned + totalUnassigned;

  const assignmentRate = totalStudents
    ? (totalAssigned / totalStudents) * 100
    : 0;

  const busiest = useMemo(() => {
    if (!counselorLoads || counselorLoads.length === 0) return null;
    return counselorLoads.reduce((a, b) =>
      (a?.total_assigned ?? 0) >= (b?.total_assigned ?? 0) ? a : b
    );
  }, [counselorLoads]);

  const averageLoad = useMemo(() => {
    if (!counselorLoads || counselorLoads.length === 0) return 0;
    const sum = counselorLoads.reduce(
      (acc, r) => acc + (r.total_assigned || 0),
      0
    );
    return Math.round((sum / counselorLoads.length) * 10) / 10;
  }, [counselorLoads]);

  useEffect(() => {
    if (!lastUpdated && (totalAssigned || totalUnassigned || totalCounselors)) {
      setLastUpdated(new Date().toISOString());
    }
  }, [lastUpdated, totalAssigned, totalUnassigned, totalCounselors]);

  return (
    <DashboardLayout title="Admin Dashboard" sidebar={<AdminSidebar />}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Student Referrals</h2>
            <p className="text-muted-foreground">
              Manage counselor assignments and create new referrals
            </p>
            {error ? (
              <div className="mt-2 text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            ) : lastUpdated ? (
              <div className="mt-2 text-xs text-muted-foreground">
                Last updated: {fmtDateTime(lastUpdated)}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading || busy}
            >
              <RotateCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>

            <Dialog
              open={showCreateReferral}
              onOpenChange={setShowCreateReferral}
            >
              <DialogTrigger asChild>
                <Button disabled={busy}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Referral
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Referral</DialogTitle>
                  <DialogDescription>
                    Refer a student to a counselor for specialized care.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-6">
                  <div>
                    <Label>To Counselor</Label>
                    <Select
                      value={toCounselorId}
                      onValueChange={setToCounselorId}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select counselor" />
                      </SelectTrigger>
                      <SelectContent>
                        {counselorOptions.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            No counselors found
                          </div>
                        ) : (
                          counselorOptions.map((c) => (
                            <SelectItem key={c._id} value={c._id}>
                              {c.name}
                              {c.counselor_type ? ` (${c.counselor_type})` : ""}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Student</Label>
                    <Select value={studentId} onValueChange={setStudentId}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {allStudentsForSelect.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            No students available
                          </div>
                        ) : (
                          allStudentsForSelect.map((s) => (
                            <SelectItem key={s._id} value={s._id}>
                              {s.name}
                              {s.profile?.department
                                ? ` — ${s.profile.department}`
                                : ""}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Reason for Referral</Label>
                    <Textarea
                      placeholder="Explain why this student is being referred..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Additional Notes (optional)</Label>
                    <Textarea
                      placeholder="Any extra context for the receiving counselor…"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div className="flex gap-4 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateReferral(false)}
                      disabled={busy}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateReferral}
                      disabled={
                        busy ||
                        !toCounselorId ||
                        !studentId ||
                        reason.trim().length === 0
                      }
                    >
                      {busy ? "Creating..." : "Create Referral"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Assigned Students"
            icon={<CheckCircle className="h-4 w-4 text-green-600" />}
            value={totalAssigned}
            hint="Latest assignment per student"
            loading={loading}
            accent="green"
          />
          <StatCard
            title="Unassigned Students"
            icon={<User className="h-4 w-4 text-blue-600" />}
            value={totalUnassigned}
            hint="No referrals yet"
            loading={loading}
            accent="blue"
          />
          <StatCard
            title="Active Counselors"
            icon={<Users className="h-4 w-4 text-indigo-600" />}
            value={totalCounselors}
            hint={`Avg. load: ${averageLoad || 0} students`}
            loading={loading}
            accent="indigo"
          />
          <StatCard
            title="Assignment Rate"
            icon={<TrendingUp className="h-4 w-4 text-amber-600" />}
            value={`${Math.round(assignmentRate)}%`}
            hint={`${totalAssigned}/${totalStudents || 0} students assigned`}
            loading={loading}
            accent="amber"
          >
            {!loading && <MiniProgress value={assignmentRate} />}
          </StatCard>
        </div>

        {/* Busiest counselor callout (optional) */}
        {busiest?.counselor && (
          <Card className="border-amber-200 bg-amber-50/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Busiest Counselor</CardTitle>
              <CardDescription>
                Balance load by assigning to others when possible.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>
                  {initials(busiest.counselor.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="font-medium">{busiest.counselor.name}</div>
                <div className="text-xs text-muted-foreground">
                  {busiest.counselor.email || "—"}
                </div>
                <div className="text-xs mt-1">
                  <Badge variant="secondary" className="mr-2">
                    {busiest.counselor.counselor_type || "unspecified"}
                  </Badge>
                  <span className="text-muted-foreground">
                    {busiest.total_assigned} assigned
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              All Referrals (Current Assignment per Student)
            </CardTitle>
            <CardDescription>
              Shows the most recent counselor assignment for each student.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="h-4 w-32 bg-muted animate-pulse mb-3 rounded" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[...Array(3)].map((__, j) => (
                        <div key={j} className="space-y-2">
                          <div className="h-4 w-40 bg-muted animate-pulse rounded" />
                          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                          <div className="h-4 w-56 bg-muted animate-pulse rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (assignedRows?.length ?? 0) === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <UserPlus className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-2">No referrals yet</h3>
                <p className="text-sm mb-4">
                  Create your first referral to see it here.
                </p>
                <Button onClick={() => setShowCreateReferral(true)}>
                  Create First Referral
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {assignedRows!.map((row, idx) => {
                  const s = row.student;
                  const c = row.counselor;
                  return (
                    <div
                      key={`${s?._id}-${idx}`}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">Current</Badge>
                          <span className="text-sm text-muted-foreground">
                            {fmtDateTime(row.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{initials(s?.name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium">
                              {s?.name ?? "Unknown student"}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {s?.email ?? "—"}
                            </div>
                            {s?.profile?.department && (
                              <div className="text-xs text-muted-foreground">
                                {s.profile.department}
                                {s.profile.level ? ` • ${s.profile.level}` : ""}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{initials(c?.name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium">
                              {c?.name ?? "Unknown counselor"}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {c?.email ?? "—"}
                            </div>
                            {c?.counselor_type && (
                              <div className="text-xs text-muted-foreground">
                                {c.counselor_type}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs text-muted-foreground">
                            REASON
                          </Label>
                          <p className="text-sm mt-1 whitespace-pre-wrap">
                            {row.reason || "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
