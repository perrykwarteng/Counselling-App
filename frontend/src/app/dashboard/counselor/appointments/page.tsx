// app/(counselor)/appointments/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Modal } from "@/components/Modal/modal";
import { cn } from "@/lib/utils";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* Icons */
import {
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Check,
  X,
  Ban,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import {
  useAppointments,
  Appointment,
  AppointmentStatus,
} from "@/Context/AppointmentProviders";
import { CounselorSidebar } from "@/components/counselorSidebar/CounselorSidebar";

/* ------------------ HELPERS ------------------ */
function fmtDate(ts: string) {
  try {
    const d = new Date(ts);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  } catch {
    return ts;
  }
}

const STATUS_BADGE: Record<NonNullable<AppointmentStatus>, string> = {
  pending: "border-amber-500 text-amber-700",
  accepted: "border-blue-500 text-blue-700",
  rejected: "border-red-500 text-red-700",
  completed: "border-green-500 text-green-700",
  cancelled: "border-gray-400 text-gray-600",
};

const ACTION_LABEL: Record<AppointmentStatus, string> = {
  accepted: "Accept",
  rejected: "Reject",
  completed: "Complete",
  cancelled: "Cancel",
  pending: "Pending",
};

function ActionIcon({ status }: { status: AppointmentStatus }) {
  if (status === "accepted") return <Check className="h-4 w-4 mr-1" />;
  if (status === "rejected") return <X className="h-4 w-4 mr-1" />;
  if (status === "completed") return <CheckCircle2 className="h-4 w-4 mr-1" />;
  if (status === "cancelled") return <Ban className="h-4 w-4 mr-1" />;
  return <AlertTriangle className="h-4 w-4 mr-1" />;
}

/* ------------------ NEW: Student directory fetch ------------------ */
type StudentLite = {
  id: string;
  name?: string;
  level?: string;
  department?: string;
};

const STUDENT_API_BASE = "/api/users"; // <-- change if your route is different

async function fetchStudentLite(id: string): Promise<StudentLite | null> {
  try {
    const res = await fetch(`${STUDENT_API_BASE}/${encodeURIComponent(id)}`, {
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = await res.json();
    // Normalize common field names
    return {
      id: String(data.id ?? data._id ?? id),
      name: data.name ?? data.full_name ?? data.displayName ?? undefined,
      level: data.level ?? data.class_level ?? data.year ?? undefined,
      department: data.department ?? data.dept ?? data.faculty ?? undefined,
    };
  } catch {
    return null;
  }
}

function useStudentDirectory(studentIds: string[]) {
  const [map, setMap] = useState<Record<string, StudentLite>>({});
  useEffect(() => {
    let mounted = true;
    const unique = Array.from(new Set(studentIds.filter(Boolean)));
    const missing = unique.filter((id) => !map[id]);
    if (missing.length === 0) return;

    (async () => {
      const results = await Promise.all(missing.map(fetchStudentLite));
      if (!mounted) return;
      const updates: Record<string, StudentLite> = {};
      results.forEach((r, idx) => {
        const id = missing[idx];
        if (r) updates[id] = r;
      });
      if (Object.keys(updates).length > 0) {
        setMap((prev) => ({ ...prev, ...updates }));
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentIds.join("|")]); // stable compare by content

  return map;
}

/* ------------------ PAGE ------------------ */
export default function CounselorAppointmentsPage() {
  const {
    loadingList,
    appointments,
    listMyAppointments,
    updateAppointmentStatus,
  } = useAppointments();

  useEffect(() => {
    listMyAppointments();
  }, [listMyAppointments]);

  // Filters
  const [query, setQuery] = useState("");
  const [modeFilter, setModeFilter] = useState<
    "all" | "video" | "chat" | "in-person"
  >("all");
  const [statusFilter, setStatusFilter] = useState<"all" | AppointmentStatus>(
    "all"
  );
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<5 | 10 | 20>(10);

  // View modal
  const [openView, setOpenView] = useState<Appointment | null>(null);

  // Confirm modal
  const [confirmAction, setConfirmAction] = useState<{
    appt: Appointment;
    next: Exclude<AppointmentStatus, "pending">;
  } | null>(null);

  // Update action state
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const rows = appointments;

  // NEW: fetch student directory for all student_ids present
  const allStudentIds = useMemo(
    () => Array.from(new Set(rows.map((r) => r.student_id))),
    [rows]
  );
  const studentMap = useStudentDirectory(allStudentIds);

  // Filter + sort (now includes student name/level/department in search)
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const fromTs = from ? new Date(from).getTime() : null;
    const toTs = to ? new Date(to).getTime() : null;

    return rows
      .filter((r) => {
        if (modeFilter !== "all" && r.mode !== modeFilter) return false;
        if (statusFilter !== "all" && (r.status ?? "pending") !== statusFilter)
          return false;

        const ts = new Date(r.scheduled_at).getTime();
        if (fromTs && ts < fromTs) return false;
        if (toTs && ts > toTs) return false;

        if (!q) return true;

        const s = studentMap[r.student_id];
        const studentBits = s
          ? `${s.name ?? ""} ${s.level ?? ""} ${s.department ?? ""}`
          : "";
        const hay = `${r.student_id} ${studentBits} ${r.counselor_id} ${
          r.mode
        } ${r.status ?? "pending"} ${r.in_person_location ?? ""} ${
          r.notes ?? ""
        }`
          .toLowerCase()
          .trim();

        return hay.includes(q);
      })
      .sort(
        (a, b) =>
          new Date(b.scheduled_at).getTime() -
          new Date(a.scheduled_at).getTime()
      );
  }, [rows, query, modeFilter, statusFilter, from, to, studentMap]);

  // Pagination
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, total);
  const pageRows = filtered.slice(start, end);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Actions
  const refetch = () => listMyAppointments();

  const canAccept = (s?: AppointmentStatus) => (s ?? "pending") === "pending";
  const canReject = (s?: AppointmentStatus) => (s ?? "pending") === "pending";
  const canCancel = (s?: AppointmentStatus) =>
    s === "accepted" || s === "pending";
  const canComplete = (s?: AppointmentStatus) => s === "accepted";

  const ask = (
    appt: Appointment,
    next: Exclude<AppointmentStatus, "pending">
  ) => setConfirmAction({ appt, next });

  const perform = async () => {
    if (!confirmAction) return;
    const { appt, next } = confirmAction;
    setUpdatingId(appt._id);
    await updateAppointmentStatus({ id: appt._id, status: next });
    setUpdatingId(null);
    setConfirmAction(null);
  };

  return (
    <DashboardLayout title="My Appointments" sidebar={<CounselorSidebar />}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              My Appointments
            </h1>
            <p className="text-sm text-muted-foreground">
              View and manage your upcoming and past sessions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={refetch}
              title="Refresh"
            >
              <RefreshCw
                className={`h-4 w-4 mr-1 ${loadingList ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filters</CardTitle>
            <CardDescription>Search and narrow appointments</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student, level, department, notes…"
                className="pl-8"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Mode */}
            <Select
              value={modeFilter}
              onValueChange={(v) => {
                setModeFilter(v as any);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All modes</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="chat">Chat</SelectItem>
                <SelectItem value="in-person">In-person</SelectItem>
              </SelectContent>
            </Select>

            {/* Status */}
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as any);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Date range */}
            <div className="grid gap-2 md:col-span-2 md:grid-cols-2">
              <div className="grid gap-1">
                <Label htmlFor="from">From</Label>
                <Input
                  id="from"
                  type="datetime-local"
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="to">To</Label>
                <Input
                  id="to"
                  type="datetime-local"
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-base">Appointments</CardTitle>
            <CardDescription>Newest first</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Scheduled</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="min-w-[240px]">Notes</TableHead>
                    <TableHead className="min-w-[160px]">Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No appointments match your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageRows.map((r) => {
                      const s = (r.status ?? "pending") as AppointmentStatus;
                      const stu = studentMap[r.student_id];
                      const subline =
                        [stu?.level, stu?.department]
                          .filter(Boolean)
                          .join(" • ") || undefined;

                      return (
                        <TableRow key={r._id}>
                          <TableCell className="whitespace-nowrap">
                            {fmtDate(r.scheduled_at)}
                          </TableCell>

                          {/* Student cell with name / level / department */}
                          <TableCell className="truncate max-w-[220px]">
                            <div className="flex flex-col">
                              <span className="font-medium truncate">
                                {stu?.name ?? r.student_id}
                              </span>
                              <span className="text-xs text-muted-foreground truncate">
                                {subline ?? "—"}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="capitalize">{r.mode}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                "capitalize",
                                STATUS_BADGE[s] ?? "border-gray-300"
                              )}
                            >
                              {s}
                            </Badge>
                          </TableCell>
                          <TableCell className="truncate max-w-[260px]">
                            {r.notes ?? "—"}
                          </TableCell>
                          <TableCell className="truncate max-w-[180px]">
                            {r.in_person_location ?? "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {canAccept(s) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl"
                                  onClick={() => ask(r, "accepted")}
                                  disabled={updatingId === r._id}
                                  title="Accept"
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Accept
                                </Button>
                              )}
                              {canReject(s) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl"
                                  onClick={() => ask(r, "rejected")}
                                  disabled={updatingId === r._id}
                                  title="Reject"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              )}
                              {canComplete(s) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl"
                                  onClick={() => ask(r, "completed")}
                                  disabled={updatingId === r._id}
                                  title="Mark completed"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Complete
                                </Button>
                              )}
                              {canCancel(s) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl"
                                  onClick={() => ask(r, "cancelled")}
                                  disabled={updatingId === r._id}
                                  title="Cancel"
                                >
                                  <Ban className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl"
                                onClick={() => setOpenView(r)}
                                title="View details"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                {total > 0 ? (
                  <>
                    Showing {start + 1}–{end} of {total}
                  </>
                ) : (
                  <>Showing 0 of 0</>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">
                    Per page
                  </span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => {
                      const size = Number(v) as 5 | 10 | 20;
                      setPageSize(size);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[72px]">
                      <SelectValue placeholder={pageSize} />
                    </SelectTrigger>
                    <SelectContent align="end" className="w-[72px]">
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="min-w-[56px] text-center text-xs text-muted-foreground">
                    {page} / {totalPages}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Modal */}
      <Modal
        open={!!openView}
        onClose={() => setOpenView(null)}
        title="Appointment"
        description={openView?._id}
        footer={
          openView && (
            <div className="flex flex-wrap gap-2">
              {(openView.status ?? "pending") === "pending" && (
                <>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => ask(openView, "accepted")}
                    disabled={updatingId === openView._id}
                  >
                    <Check className="h-4 w-4 mr-1" /> Accept
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => ask(openView, "rejected")}
                    disabled={updatingId === openView._id}
                  >
                    <X className="h-4 w-4 mr-1" /> Reject
                  </Button>
                </>
              )}
              {openView.status === "accepted" && (
                <>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => ask(openView, "completed")}
                    disabled={updatingId === openView._id}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Complete
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => ask(openView, "cancelled")}
                    disabled={updatingId === openView._id}
                  >
                    <Ban className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                </>
              )}
            </div>
          )
        }
      >
        {openView && (
          <div className="grid gap-3 text-sm">
            <div className="grid gap-1">
              <span className="text-muted-foreground">Scheduled</span>
              <span>{fmtDate(openView.scheduled_at)}</span>
            </div>
            {/* NEW: student details */}
            <div className="grid gap-1">
              <span className="text-muted-foreground">Student</span>
              <span className="font-medium">
                {studentMap[openView.student_id]?.name ?? openView.student_id}
              </span>
              <span className="text-xs text-muted-foreground">
                {[
                  studentMap[openView.student_id]?.level,
                  studentMap[openView.student_id]?.department,
                ]
                  .filter(Boolean)
                  .join(" • ") || "—"}
              </span>
            </div>
            <div className="grid gap-1">
              <span className="text-muted-foreground">Mode</span>
              <span className="capitalize">{openView.mode}</span>
            </div>
            <div className="grid gap-1">
              <span className="text-muted-foreground">Status</span>
              <Badge
                variant="outline"
                className={cn(
                  "capitalize w-fit",
                  STATUS_BADGE[
                    (openView.status ?? "pending") as AppointmentStatus
                  ]
                )}
              >
                {openView.status ?? "pending"}
              </Badge>
            </div>
            {openView.in_person_location && (
              <div className="grid gap-1">
                <span className="text-muted-foreground">Location</span>
                <span>{openView.in_person_location}</span>
              </div>
            )}
            {openView.notes && (
              <div className="grid gap-1">
                <span className="text-muted-foreground">Notes</span>
                <pre className="bg-muted/50 p-2 rounded-lg overflow-x-auto text-xs">
                  {openView.notes}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Confirm Action Modal */}
      <Modal
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title="Confirm Action"
        description={
          confirmAction
            ? `${ACTION_LABEL[confirmAction.next]} this appointment?`
            : ""
        }
        footer={
          confirmAction && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setConfirmAction(null)}
                disabled={updatingId === confirmAction.appt._id}
              >
                Cancel
              </Button>
              <Button
                className="rounded-xl"
                onClick={perform}
                disabled={updatingId === confirmAction.appt._id}
                title={ACTION_LABEL[confirmAction.next]}
              >
                <ActionIcon status={confirmAction.next} />
                {ACTION_LABEL[confirmAction.next]}
              </Button>
            </div>
          )
        }
      >
        {confirmAction && (
          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              <span>
                Are you sure you want to{" "}
                <b className="capitalize">
                  {ACTION_LABEL[confirmAction.next].toLowerCase()}
                </b>{" "}
                this appointment? This action may notify the student.
              </span>
            </div>

            <div className="grid gap-1">
              <span className="text-muted-foreground">Appointment ID</span>
              <span className="font-mono text-xs">
                {confirmAction.appt._id}
              </span>
            </div>

            <div className="grid gap-1">
              <span className="text-muted-foreground">Scheduled</span>
              <span>{fmtDate(confirmAction.appt.scheduled_at)}</span>
            </div>

            {/* NEW: student details here too */}
            <div className="grid gap-1">
              <span className="text-muted-foreground">Student</span>
              <span className="font-medium">
                {studentMap[confirmAction.appt.student_id]?.name ??
                  confirmAction.appt.student_id}
              </span>
              <span className="text-xs text-muted-foreground">
                {[
                  studentMap[confirmAction.appt.student_id]?.level,
                  studentMap[confirmAction.appt.student_id]?.department,
                ]
                  .filter(Boolean)
                  .join(" • ") || "—"}
              </span>
            </div>

            <div className="grid gap-1">
              <span className="text-muted-foreground">Current status</span>
              <Badge
                variant="outline"
                className={cn(
                  "capitalize w-fit",
                  STATUS_BADGE[
                    (confirmAction.appt.status ??
                      "pending") as AppointmentStatus
                  ]
                )}
              >
                {confirmAction.appt.status ?? "pending"}
              </Badge>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
