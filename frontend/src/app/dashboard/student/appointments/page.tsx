"use client";

import { useMemo, useRef, useState } from "react";
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
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StudentSidebar } from "@/components/studentSidebar/StudentSidebar";
import { cn } from "@/lib/utils";
import { CounselorSelect } from "@/components/CounselorSelect/CounselorSelect";
import { Modal } from "@/components/Modal/modal";

/* ------------------ TYPES ------------------ */
type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";
type SessionMode = "video" | "chat" | "in-person";

type Appointment = {
  id: string;
  counselorId: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm" 24h
  type: SessionMode;
  status: AppointmentStatus;
  isAnonymous: boolean;
  note?: string;
};

type Counselor = {
  id: string;
  name: string;
  type: "Psychologist" | "Therapist" | "Counselor";
  isOnline: boolean;
  rating: number;
  totalSessions: number;
  bio: string;
  specializations: string[];
};

/* ------------------ MOCK DATA ------------------ */
const mockCounselors: Counselor[] = [
  {
    id: "c1",
    name: "Dr. Ama Mensah",
    type: "Psychologist",
    isOnline: true,
    rating: 4.8,
    totalSessions: 120,
    bio: "Specialist in stress management and student mental health.",
    specializations: ["Stress", "Anxiety", "Mindfulness"],
  },
  {
    id: "c2",
    name: "Mr. Kwesi Ofori",
    type: "Therapist",
    isOnline: false,
    rating: 4.6,
    totalSessions: 90,
    bio: "Helping students with academic pressure and relationships.",
    specializations: ["Academics", "Relationships", "Depression"],
  },
  {
    id: "c3",
    name: "Dr. Grace Owusu",
    type: "Counselor",
    isOnline: true,
    rating: 4.9,
    totalSessions: 200,
    bio: "Focused on mindfulness and holistic wellbeing.",
    specializations: ["Mindfulness", "Anxiety", "Self-growth"],
  },
];

const mockAppointments: Appointment[] = [
  {
    id: "a1",
    counselorId: "c1",
    date: "2025-09-21",
    time: "10:00",
    type: "video",
    status: "confirmed",
    isAnonymous: false,
  },
  {
    id: "a2",
    counselorId: "c2",
    date: "2025-09-03",
    time: "14:00",
    type: "chat",
    status: "pending",
    isAnonymous: true,
    note: "First time",
  },
];

/* ------------------ HELPERS ------------------ */
function toISODateTime(date: string, time: string) {
  try {
    return new Date(`${date}T${time}:00`).toISOString();
  } catch {
    return null;
  }
}

const SessionBadge = ({ mode }: { mode: SessionMode }) => (
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

/* ------------------ COMPONENT ------------------ */
export default function AppointmentsPage() {
  const [appointments, setAppointments] =
    useState<Appointment[]>(mockAppointments);

  const [selectedCounselor, setSelectedCounselor] = useState<string | null>(
    null
  );
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [mode, setMode] = useState<SessionMode | null>(null);
  const [location, setLocation] = useState<string>("Counseling Room 5");
  const [notes, setNotes] = useState<string>("");
  const [anonymous, setAnonymous] = useState(false);

  // modal state
  const [open, setOpen] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const today = new Date();
  const upcoming = appointments.filter(
    (appt) => new Date(`${appt.date}T${appt.time}`) >= today
  );
  const past = appointments.filter(
    (appt) => new Date(`${appt.date}T${appt.time}`) < today
  );

  const canSubmit =
    !!selectedCounselor &&
    !!date &&
    !!time &&
    !!mode &&
    (mode !== "in-person" || !!location);

  async function handleBook() {
    if (!canSubmit) return;
    const scheduled_at = toISODateTime(date, time);

    const optimistic: Appointment = {
      id: `a${appointments.length + 1}`,
      counselorId: selectedCounselor!,
      date,
      time,
      type: mode!,
      status: "pending",
      isAnonymous: anonymous,
      note: notes || undefined,
    };

    setAppointments((prev) => [optimistic, ...prev]);

    // Reset form & close modal
    setSelectedCounselor(null);
    setDate("");
    setTime("");
    setMode(null);
    setLocation("");
    setNotes("");
    setAnonymous(false);
    setOpen(false);
  }

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
            onClick={() => setOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Book Appointment
          </Button>
        </div>

        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Book New Appointment"
          description="Choose a counselor and schedule your session"
          initialFocusRef={firstFieldRef}
          footer={
            <Button
              className="w-full rounded-2xl"
              disabled={!canSubmit}
              onClick={handleBook}
            >
              Book Appointment
            </Button>
          }
        >
          <div className="grid gap-5 sm:gap-6">
            <div className="grid gap-2">
              <Label className="text-sm">Select Counselor</Label>
              <CounselorSelect
                counselors={mockCounselors}
                value={selectedCounselor}
                onChange={(id) => setSelectedCounselor(id)}
              />
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="date" className="text-sm">
                  Date
                </Label>
                <Input
                  ref={firstFieldRef}
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
                  disabled
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

        {/* UPCOMING APPOINTMENTS */}
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
                const counselor = mockCounselors.find(
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
                          {counselor?.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{counselor?.name}</p>
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

        {/* PAST APPOINTMENTS */}
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
                const counselor = mockCounselors.find(
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
                          {counselor?.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{counselor?.name}</p>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{appt.date}</span>
                          <Clock className="h-4 w-4 ml-2" />
                          <span>{appt.time}</span>
                          <SessionBadge mode={appt.type} />
                        </div>
                        {appt.note && (
                          <p className="text-xs mt-1 text-muted-foreground">
                            Notes: {appt.note}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                      >
                        Rebook
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
