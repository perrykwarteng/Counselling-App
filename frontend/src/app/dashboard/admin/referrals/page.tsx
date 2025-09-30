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
} from "lucide-react";
import { AdminSidebar } from "@/components/adminSidebar/AdminSidebar";
import { toast } from "sonner";

// ✅ use the new hook that returns the referrals object directly
import { useAdminReferrals } from "@/Context/AdminReferralsProvider";

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

export default function AdminReferralsPage() {
  const router = useRouter();

  // ⬇️ match the provider API: items = filtered latest-per-student rows
  const {
    items: assignedRows,
    counselors: counselorLoads,
    unassigned,
    loading,
    error,
    refetch,
    refer,
  } = useAdminReferrals();

  // Dialog + form state
  const [showCreateReferral, setShowCreateReferral] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toCounselorId, setToCounselorId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const initials = (n?: string) =>
    (n || "")
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .join("")
      .slice(0, 3)
      .toUpperCase();

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
    } catch (e: any) {
      toast.error(e?.message || "Failed to create referral", { id: t });
    } finally {
      setBusy(false);
    }
  }

  const totalAssigned = assignedRows?.length ?? 0;
  const totalUnassigned = unassigned?.length ?? 0;
  const totalCounselors = counselorLoads?.length ?? 0;

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
                <Button>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Assigned Students
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAssigned}</div>
              <p className="text-xs text-muted-foreground">
                Latest assignment per student
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Unassigned Students
              </CardTitle>
              <User className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUnassigned}</div>
              <p className="text-xs text-muted-foreground">No referrals yet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Counselors
              </CardTitle>
              <UserPlus className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCounselors}</div>
              <p className="text-xs text-muted-foreground">
                Receiving current assignments
              </p>
            </CardContent>
          </Card>
        </div>

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
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="h-16 w-16 mx-auto mb-4 opacity-20" />
                Loading…
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
                            {new Date(row.created_at).toLocaleString()}
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
