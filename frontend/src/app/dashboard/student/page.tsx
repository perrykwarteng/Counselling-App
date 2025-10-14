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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar,
  MessageCircle,
  Heart,
  BookOpen,
  TrendingUp,
  Clock,
  CheckCircle,
  User,
  ArrowRight,
} from "lucide-react";
import { StudentSidebar } from "@/components/studentSidebar/StudentSidebar";

// ✅ use the Appointment context (counselors + appointments)
import {
  AppointmentProvider,
  useAppointments,
  type AppointmentMode,
} from "@/Context/AppointmentProviders";

/* ============ Small helpers ============ */
function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function minutesUntil(iso: string) {
  const d = new Date(iso).getTime();
  const now = Date.now();
  return Math.round((d - now) / 60000);
}

/* ============ Inner page that consumes the provider ============ */
function StudentDashboardInner() {
  const {
    // data
    appointments,
    counselors,

    // loading/error flags
    loadingList,
    loadingCounselors,
    error,
    counselorError,

    // actions
    ensureAllLoaded,
    createAppointment,
  } = useAppointments();

  // load counselors + appointments once
  useEffect(() => {
    ensureAllLoaded();
  }, [ensureAllLoaded]);

  // derived: upcoming appointments sorted soonest → latest
  const upcoming = useMemo(() => {
    const now = Date.now();
    return appointments
      .filter((a) => new Date(a.scheduled_at).getTime() >= now)
      .sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() -
          new Date(b.scheduled_at).getTime()
      );
  }, [appointments]);

  const nextSession = upcoming[0];
  const nextInMins = nextSession?.scheduled_at
    ? minutesUntil(nextSession.scheduled_at)
    : null;

  /* ===== Quick book modal state ===== */
  const [open, setOpen] = useState(false);
  const [counselorId, setCounselorId] = useState("");
  const [scheduledAt, setScheduledAt] = useState(""); // HTML datetime-local value
  const [mode, setMode] = useState<AppointmentMode>("video");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // map counselors to select options
  const counselorOptions = useMemo(
    () =>
      counselors
        .map((c) => ({
          id: c.id,
          name: c.name || "Unknown",
          type: c.counselor_type || "",
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [counselors]
  );

  async function onCreate() {
    if (!counselorId || !scheduledAt) return;

    // datetime-local gives "YYYY-MM-DDTHH:mm"; convert to ISO
    const iso = new Date(scheduledAt).toISOString();

    setSubmitting(true);
    const created = await createAppointment({
      counselor_id: counselorId,
      scheduled_at: iso,
      mode,
      notes: notes || undefined,
    });
    setSubmitting(false);

    if (created) {
      // reset + close
      setCounselorId("");
      setScheduledAt("");
      setMode("video");
      setNotes("");
      setOpen(false);
    }
  }

  const loading = loadingList || loadingCounselors || submitting;

  return (
    <DashboardLayout title="Student Dashboard" sidebar={<StudentSidebar />}>
      <div className="space-y-6">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-slate-900 to-blue-500 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome back</h2>
          <p className="text-blue-100">
            How are you feeling today? Taking care of your mental health
            matters.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Next Session
              </CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {nextSession ? (
                <>
                  <div className="text-sm font-medium">
                    {formatDateTime(nextSession.scheduled_at)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {nextInMins !== null && nextInMins >= 0
                      ? nextInMins < 60
                        ? `in ${nextInMins} mins`
                        : `in ${Math.round(nextInMins / 60)} hours`
                      : "soon"}
                  </p>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No session scheduled
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Unread Messages
              </CardTitle>
              <MessageCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                From your counselor
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Current Mood
              </CardTitle>
              <Heart className="h-4 w-4 text-pink-600" />
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Log today’s mood
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Resources Viewed
              </CardTitle>
              <BookOpen className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming + Quick book */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Appointments
              </CardTitle>
              <CardDescription>
                Your scheduled counseling sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcoming.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming appointments</p>
                </div>
              ) : (
                <>
                  {upcoming.slice(0, 5).map((a) => (
                    <div
                      key={a._id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <div>
                          <p className="font-medium capitalize">
                            {a.mode} session
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(a.scheduled_at)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          a.status === "accepted"
                            ? "default"
                            : a.status === "pending"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {a.status || "pending"}
                      </Badge>
                    </div>
                  ))}
                </>
              )}
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" disabled={loading}>
                    Book Appointment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Book a new appointment</DialogTitle>
                    <DialogDescription>
                      Choose a counselor and a time. (Uses counselors from
                      AppointmentProvider)
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-xs text-muted-foreground">
                        Counselor
                      </label>
                      <select
                        className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                        value={counselorId}
                        onChange={(e) => setCounselorId(e.target.value)}
                      >
                        <option value="" disabled>
                          {loadingCounselors
                            ? "Loading counselors..."
                            : "Select"}
                        </option>
                        {counselorOptions.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.type ? `(${c.type})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground">
                        When
                      </label>
                      <input
                        type="datetime-local"
                        className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground">
                        Mode
                      </label>
                      <select
                        className="mt-1 w-full border rounded-md px-3 py-2 text-sm capitalize"
                        value={mode}
                        onChange={(e) =>
                          setMode(e.target.value as AppointmentMode)
                        }
                      >
                        <option value="video">video</option>
                        <option value="chat">chat</option>
                        <option value="in-person">in-person</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground">
                        Notes (optional)
                      </label>
                      <textarea
                        className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Anything you'd like your counselor to know in advance"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={onCreate}
                        disabled={!counselorId || !scheduledAt || submitting}
                      >
                        {submitting ? "Booking…" : "Book"}
                      </Button>
                    </div>

                    {(error || counselorError) && (
                      <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                        {error || counselorError}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Notifications / Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Activity
              </CardTitle>
              <CardDescription>Recent updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Messages, reminders, and more will appear here.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ============ Exported page with Provider wrapper ============ */
export default function StudentDashboard() {
  return (
    <AppointmentProvider>
      <StudentDashboardInner />
    </AppointmentProvider>
  );
}
