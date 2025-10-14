// app/(student)/appointments/page.tsx
"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Calendar,
  Clock,
  Video,
  MessageCircle,
  MapPin,
  Plus,
  UserCircle2,
  ExternalLink,
  RotateCcw,
  ChevronsUpDown,
  Check,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StudentSidebar } from "@/components/studentSidebar/StudentSidebar";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/Modal/modal";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import {
  AppointmentStatus,
  useAppointments,
  AppointmentMode,
  Appointment,
  Counselor,
} from "@/Context/AppointmentProviders";

/* ------------------ SIMPLE TYPES ------------------ */
type UIAppointmentStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "completed";
type UISessionMode = "video" | "chat" | "in-person";

type UIAppointment = {
  id: string;
  counselorId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: UISessionMode;
  status: UIAppointmentStatus;
  isAnonymous: boolean;
  note?: string;
};

/* ------------------ HELPERS ------------------ */
function isFutureDateTime(date: string, time: string) {
  const d = new Date(`${date}T${time}:00`);
  return d.getTime() > Date.now();
}

function toISOWithOffset(date: string, time: string) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);

  const pad = (n: number) => String(Math.abs(n)).padStart(2, "0");
  const offMin = d.getTimezoneOffset();
  const sign = offMin <= 0 ? "+" : "-";
  const hhOff = pad(Math.floor(Math.abs(offMin) / 60));
  const mmOff = pad(Math.abs(offMin) % 60);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:00${sign}${hhOff}:${mmOff}`;
}

const SessionBadge = ({ mode }: { mode: UISessionMode }) => (
  <Badge
    variant="outline"
    className={cn("capitalize", {
      "border-blue-500 text-blue-700": mode === "video",
      "border-green-500 text-green-700": mode === "chat",
      "border-amber-500 text-amber-700": mode === "in-person",
    })}
  >
    {mode}
  </Badge>
);

function mapStatusToUI(s?: AppointmentStatus): UIAppointmentStatus {
  switch (s) {
    case "accepted":
      return "confirmed";
    case "rejected":
      return "rejected";
    case "cancelled":
      return "cancelled";
    case "completed":
      return "completed";
    case "pending":
    default:
      return "pending";
  }
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${mi}` };
}

function apiToUI(a: Appointment): UIAppointment {
  const { date, time } = formatDateTime(a.scheduled_at);
  return {
    id: a._id,
    counselorId: String(a.counselor_id),
    date,
    time,
    type: a.mode as UISessionMode,
    status: mapStatusToUI(a.status),
    isAnonymous: false,
    note: a.notes || undefined,
  };
}

/* ------------------ COMPONENT ------------------ */
export default function AppointmentsPage() {
  const {
    appointments: apiAppointments,
    createAppointment,
    loadingList,
    loadingCreate,
    error,

    counselors,
    loadingCounselors,
    counselorError,

    ensureAllLoaded,
  } = useAppointments();

  useEffect(() => {
    ensureAllLoaded();
  }, [ensureAllLoaded]);

  // Modal focus target
  const firstFieldRef = useRef<HTMLButtonElement | null>(null);

  const [selectedCounselor, setSelectedCounselor] = useState<string | null>(
    null
  );
  const [counselorTypeFilter, setCounselorTypeFilter] = useState<
    "all" | string
  >("all");
  const [counselorOpen, setCounselorOpen] = useState(false);

  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [mode, setMode] = useState<UISessionMode | null>(null);
  const [location, setLocation] = useState<string>("Counseling Room 5");
  const [notes, setNotes] = useState<string>("");
  const [anonymous, setAnonymous] = useState(false);
  const [open, setOpen] = useState(false);

  // Derived data
  const uiAppointments = useMemo<UIAppointment[]>(
    () => apiAppointments.map(apiToUI),
    [apiAppointments]
  );

  const now = new Date();
  const upcoming = uiAppointments.filter(
    (appt) => new Date(`${appt.date}T${appt.time}:00`) >= now
  );
  const past = uiAppointments.filter(
    (appt) => new Date(`${appt.date}T${appt.time}:00`) < now
  );

  const filteredCounselors: Counselor[] = useMemo(() => {
    if (counselorTypeFilter === "all") return counselors;
    return counselors.filter(
      (c) =>
        (c.counselor_type || "").toLowerCase() ===
        counselorTypeFilter.toLowerCase()
    );
  }, [counselors, counselorTypeFilter]);

  const chosen = useMemo(
    () => counselors.find((c) => c.id === selectedCounselor),
    [counselors, selectedCounselor]
  );

  const validWhen = !!date && !!time && isFutureDateTime(date, time);
  const canSubmit =
    !!chosen && validWhen && !!mode && (mode !== "in-person" || !!location);

  async function handleBook() {
    if (!canSubmit) return;
    const scheduled_at = toISOWithOffset(date, time);

    await createAppointment({
      counselor_id: selectedCounselor!, // UUID/string from counselors API
      scheduled_at,
      mode: mode as AppointmentMode,
      in_person_location: mode === "in-person" ? location : undefined,
      notes: notes || undefined,
      is_anonymous: anonymous || undefined,
    });

    // reset
    setSelectedCounselor(null);
    setDate("");
    setTime("");
    setMode(null);
    setLocation("Counseling Room 5");
    setNotes("");
    setAnonymous(false);
    setOpen(false);
  }

  function openRebook(appt: UIAppointment) {
    // If IDs line up with currently available counselors
    const byUi = counselors.find((c) => c.id === appt.counselorId);
    setSelectedCounselor(byUi?.id ?? null);

    setMode(appt.type);
    setNotes(appt.note ?? "");
    setDate("");
    setTime("");
    setLocation("Counseling Room 5");
    setAnonymous(false);
    setOpen(true);
    setTimeout(() => firstFieldRef.current?.focus(), 0);
  }

  const counselorTypes = useMemo(() => {
    const set = new Set(
      counselors
        .map((c) => (c.counselor_type || "").trim())
        .filter(Boolean) as string[]
    );
    return Array.from(set);
  }, [counselors]);

  return (
    <DashboardLayout title="Student Dashboard" sidebar={<StudentSidebar />}>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
            <p className="text-sm text-muted-foreground">
              Book, track, and join your counseling sessions
            </p>
          </div>
          <Button
            className="h-9 rounded-2xl shadow-sm"
            onClick={() => {
              setOpen(true);
              setTimeout(() => firstFieldRef.current?.focus(), 0);
            }}
            disabled={loadingCreate}
          >
            <Plus className="mr-2 h-4 w-4" /> Book Appointment
          </Button>
        </div>

        {error && (
          <div className="text-sm text-red-600 border border-red-200 bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}
        {(loadingList || loadingCounselors) && (
          <div className="text-sm text-muted-foreground">
            Loading{loadingList && loadingCounselors ? "…" : ""}{" "}
            {loadingList ? "appointments" : ""}{" "}
            {loadingList && loadingCounselors ? "and" : ""}{" "}
            {loadingCounselors ? "counselors" : ""}…
          </div>
        )}

        {/* BOOKING MODAL */}
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Book New Appointment"
          description="Choose a counselor and schedule your session"
          initialFocusRef={firstFieldRef}
          footer={
            <Button
              className="w-full rounded-2xl"
              disabled={!canSubmit || loadingCreate}
              onClick={handleBook}
              title={
                !selectedCounselor
                  ? "Pick a counselor"
                  : !validWhen
                  ? "Pick a future date/time"
                  : undefined
              }
            >
              {loadingCreate ? "Booking…" : "Book Appointment"}
            </Button>
          }
        >
          <div className="grid gap-5 sm:gap-6">
            {/* Counselor type filter */}
            <div className="grid gap-2">
              <Label className="text-sm">Counselor type</Label>
              <Select
                value={counselorTypeFilter}
                onValueChange={(v) => setCounselorTypeFilter(v)}
              >
                <SelectTrigger className="h-9 rounded-md">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {counselorTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Searchable counselor select */}
            <div className="grid gap-2">
              <Label className="text-sm">Select counselor</Label>
              <Popover open={counselorOpen} onOpenChange={setCounselorOpen}>
                <PopoverTrigger asChild>
                  <Button
                    ref={firstFieldRef}
                    variant="outline"
                    role="combobox"
                    aria-expanded={counselorOpen}
                    className="w-full justify-between rounded-md h-9"
                    disabled={loadingCounselors || counselors.length === 0}
                  >
                    {selectedCounselor
                      ? counselors.find((c) => c.id === selectedCounselor)?.name
                      : loadingCounselors
                      ? "Loading counselors…"
                      : counselors.length === 0
                      ? counselorError || "No counselors available"
                      : "Search and select counselor"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
                  <Command>
                    <CommandInput placeholder="Search counselors…" />
                    <CommandEmpty>No counselor found.</CommandEmpty>
                    <CommandList>
                      <CommandGroup>
                        {filteredCounselors.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={`${c.name} ${c.id} ${
                              c.counselor_type ?? ""
                            }`}
                            onSelect={() => {
                              setSelectedCounselor(c.id);
                              setCounselorOpen(false);
                            }}
                            className="flex items-center gap-2"
                          >
                            <Check
                              className={cn(
                                "h-4 w-4",
                                selectedCounselor === c.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div className="flex items-center gap-2">
                              <span className="truncate">{c.name}</span>
                              {c.counselor_type && (
                                <Badge variant="outline" className="capitalize">
                                  {c.counselor_type}
                                </Badge>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="date" className="text-sm">
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="time" className="text-sm">
                  Time
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>
            {!!date && !!time && !isFutureDateTime(date, time) && (
              <p className="text-xs text-red-600 -mt-2">
                Please choose a future time.
              </p>
            )}

            <div className="grid gap-3">
              <Label className="text-sm">Session Type</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={mode === "video" ? "default" : "outline"}
                  onClick={() => setMode("video")}
                  className="justify-start gap-2 rounded-xl"
                >
                  <Video className="h-4 w-4" /> Video Call
                </Button>
                <Button
                  type="button"
                  variant={mode === "chat" ? "default" : "outline"}
                  onClick={() => setMode("chat")}
                  className="justify-start gap-2 rounded-xl"
                >
                  <MessageCircle className="h-4 w-4" /> Text Chat
                </Button>
                <Button
                  type="button"
                  variant={mode === "in-person" ? "default" : "outline"}
                  onClick={() => setMode("in-person")}
                  className="justify-start gap-2 rounded-xl"
                >
                  <MapPin className="h-4 w-4" /> In-person
                </Button>
              </div>
            </div>

            {mode === "in-person" && (
              <div className="grid gap-2">
                <Label htmlFor="location" className="text-sm">
                  Location
                </Label>
                <Input
                  id="location"
                  placeholder="e.g., Counseling Office, Room 3"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="notes" className="text-sm">
                Notes (optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Anything you want your counselor to know ahead of time"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[90px]"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <UserCircle2 className="h-4 w-4" /> Book anonymously
                </Label>
                <p className="text-xs text-muted-foreground">
                  Your counselor won’t see your personal details. (Your school
                  may still verify your identity.)
                </p>
              </div>
              <Switch checked={anonymous} onCheckedChange={setAnonymous} />
            </div>
          </div>
        </Modal>

        {/* UPCOMING */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>
              Stay prepared for your next sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No upcoming appointments.
              </p>
            ) : (
              upcoming.map((appt) => {
                const counselor = counselors.find(
                  (c) => c.id === appt.counselorId
                );
                return (
                  <div
                    key={appt.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {counselor?.name?.charAt(0) ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{counselor?.name ?? "—"}</p>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{appt.date}</span>
                          <Clock className="h-4 w-4 ml-2" />
                          <span>{appt.time}</span>
                          <SessionBadge mode={appt.type} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "capitalize",
                          appt.status === "rejected" && "border-red-400"
                        )}
                      >
                        {appt.status}
                      </Badge>
                      {appt.type === "video" && appt.status === "confirmed" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="rounded-xl"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" /> Join Video
                        </Button>
                      )}
                      {appt.type === "chat" && appt.status === "confirmed" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="rounded-xl"
                        >
                          <MessageCircle className="h-4 w-4 mr-1" /> Open Chat
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* PAST */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Past Appointments</CardTitle>
            <CardDescription>Review your previous sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {past.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No past appointments.
              </p>
            ) : (
              past.map((appt) => {
                const counselor = counselors.find(
                  (c) => c.id === appt.counselorId
                );
                return (
                  <div
                    key={appt.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {counselor?.name?.charAt(0) ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{counselor?.name ?? "—"}</p>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{appt.date}</span>
                          <Clock className="h-4 w-4 ml-2" />
                          <span>{appt.time}</span>
                          <SessionBadge mode={appt.type} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {appt.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-xl"
                        onClick={() => openRebook(appt)}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" /> Book Again
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
