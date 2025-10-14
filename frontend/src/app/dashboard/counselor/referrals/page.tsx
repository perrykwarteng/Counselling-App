// app/(dashboard)/counselor/referrals/page.tsx  (or wherever your page lives)
"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  XCircle,
  Clock,
  Send,
  User,
  ArrowRight,
} from "lucide-react";

import { CounselorSidebar } from "@/components/counselorSidebar/CounselorSidebar";

// ✅ contexts
import {
  AdminReferralProvider,
  useAdminReferrals,
} from "@/Context/AdminReferralsProvider";
import {
  AppointmentProvider,
  useAppointments,
} from "@/Context/AppointmentProviders";

/* =========================
   Internal page that uses both contexts
   ========================= */
function CounselorReferralsInner() {
  // ---- referral data/actions (students, latest assignments, unassigned, refer(...))
  const {
    items,
    unassigned,
    loading,
    error,
    query,
    setQuery,
    refetch,
    ensureLoaded, // referrals lazy-load
    refer,
  } = useAdminReferrals();

  // ---- counselors come from AppointmentProvider
  const {
    counselors: apptCounselors,
    loadingCounselors,
    ensureCounselorsLoaded, // counselors lazy-load
  } = useAppointments();

  const [showCreateReferral, setShowCreateReferral] = useState(false);
  const [newReferral, setNewReferral] = useState({
    toCounselorId: "",
    studentId: "",
    reason: "",
    notes: "",
  });

  // Load both datasets once
  useEffect(() => {
    ensureLoaded();
    ensureCounselorsLoaded();
  }, [ensureLoaded, ensureCounselorsLoaded]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "accepted":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "declined":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "accepted":
        return "default";
      case "declined":
        return "destructive";
      default:
        return "secondary";
    }
  };

  // ---- student dropdown: unique from latest assignments + unassigned
  const studentOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const row of items) {
      const s = row.student;
      if (s?._id && !map.has(s._id)) {
        map.set(s._id, { id: s._id, name: s.name || s.email || "Unknown" });
      }
    }
    for (const s of unassigned) {
      if (s?._id && !map.has(s._id)) {
        map.set(s._id, {
          id: s._id as string,
          name: s.name || s.email || "Unknown",
        });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [items, unassigned]);

  // ---- counselor dropdown: from AppointmentProvider.counselors
  const counselorOptions = useMemo(() => {
    return (apptCounselors || [])
      .map((c) => ({ id: String(c.id), name: c.name || "Unknown" }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [apptCounselors]);

  // submit referral
  const onCreateReferral = async () => {
    const { studentId, toCounselorId, reason } = newReferral;
    if (!studentId || !toCounselorId || !reason) return;
    const ok = await refer(studentId, toCounselorId, reason);
    if (ok) {
      setNewReferral({
        toCounselorId: "",
        studentId: "",
        reason: "",
        notes: "",
      });
      setShowCreateReferral(false);
    }
  };

  // simple stats
  const totalLatestAssignments = items.length;
  const totalUnassigned = unassigned.length;
  const totalCounselors = apptCounselors.length;

  return (
    <DashboardLayout title="Student Referrals" sidebar={<CounselorSidebar />}>
      <div className="space-y-6">
        {/* Header + create dialog */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Student Referrals</h2>
            <p className="text-muted-foreground">
              Refer students to other counselors or review latest assignments
            </p>
          </div>

          <Dialog
            open={showCreateReferral}
            onOpenChange={setShowCreateReferral}
          >
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Refer Student
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Refer Student to Another Counselor</DialogTitle>
                <DialogDescription>
                  Transfer a student to a counselor with more appropriate
                  expertise.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Student</Label>
                    <Select
                      value={newReferral.studentId}
                      onValueChange={(value) =>
                        setNewReferral((prev) => ({
                          ...prev,
                          studentId: value,
                        }))
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {studentOptions.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Refer to Counselor</Label>
                    <Select
                      value={newReferral.toCounselorId}
                      onValueChange={(value) =>
                        setNewReferral((prev) => ({
                          ...prev,
                          toCounselorId: value,
                        }))
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue
                          placeholder={
                            loadingCounselors
                              ? "Loading..."
                              : "Select counselor"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {counselorOptions.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Reason for Referral</Label>
                  <Textarea
                    placeholder="Explain why this student should be reassigned..."
                    value={newReferral.reason}
                    onChange={(e) =>
                      setNewReferral((prev) => ({
                        ...prev,
                        reason: e.target.value,
                      }))
                    }
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Additional Information (optional)</Label>
                  <Textarea
                    placeholder="Any context for the receiving counselor..."
                    value={newReferral.notes}
                    onChange={(e) =>
                      setNewReferral((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    className="mt-2"
                  />
                </div>

                <div className="flex gap-4 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateReferral(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={onCreateReferral}
                    disabled={
                      !newReferral.toCounselorId ||
                      !newReferral.studentId ||
                      !newReferral.reason ||
                      loading
                    }
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {loading ? "Sending..." : "Send Referral"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search student, counselor, email, department..."
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Latest Assignments
              </CardTitle>
              <Send className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLatestAssignments}</div>
              <p className="text-xs text-muted-foreground">
                Students with a current counselor
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Unassigned Students
              </CardTitle>
              <UserPlus className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUnassigned}</div>
              <p className="text-xs text-muted-foreground">
                Available to assign
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Counselors</CardTitle>
              <User className="h-4 w-4 text-violet-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCounselors}</div>
              <p className="text-xs text-muted-foreground">Active counselors</p>
            </CardContent>
          </Card>
        </div>

        {/* Latest assignments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Latest Assignments
              </CardTitle>
              <CardDescription>
                Each student’s most recent counselor assignment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <h3 className="font-medium mb-2">No assignments yet</h3>
                  <p className="text-sm">Use “Refer Student” to assign one.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((row, idx) => (
                    <div
                      key={`${row.student?._id ?? idx}-${row.created_at}`}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon("pending")}
                          <Badge variant={getStatusColor("pending") as any}>
                            latest
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(row.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">
                          {row.student?.name ||
                            row.student?.email ||
                            "Unknown student"}
                        </span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {row.counselor?.name ||
                            row.counselor?.email ||
                            "Unknown counselor"}
                        </span>
                      </div>

                      {row.reason && (
                        <p className="text-sm text-muted-foreground truncate">
                          {row.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Unassigned students */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Unassigned Students
              </CardTitle>
              <CardDescription>
                Students currently not assigned to any counselor
              </CardDescription>
            </CardHeader>
            <CardContent>
              {unassigned.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <h3 className="font-medium mb-2">No unassigned students</h3>
                </div>
              ) : (
                <div className="space-y-3">
                  {unassigned.map((s) => (
                    <div
                      key={s._id}
                      className="flex items-center justify-between border rounded-lg p-3"
                    >
                      <div>
                        <div className="font-medium text-sm">
                          {s.name || s.email}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {s.profile?.department
                            ? `Dept: ${s.profile.department}`
                            : ""}
                          {s.profile?.level ? ` • ${s.profile.level}` : ""}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowCreateReferral(true);
                          setNewReferral((prev) => ({
                            ...prev,
                            studentId: s._id as string,
                          }));
                        }}
                      >
                        Refer
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Error banner */}
        {error && (
          <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

/* =========================
   Exported page with BOTH providers
   ========================= */
export default function CounselorReferralsPage() {
  return (
    <AppointmentProvider>
      <AdminReferralProvider>
        <CounselorReferralsInner />
      </AdminReferralProvider>
    </AppointmentProvider>
  );
}
