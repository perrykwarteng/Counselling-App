"use client";

import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  Video,
  MessageCircle,
  Star,
  Plus,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StudentSidebar } from "@/components/studentSidebar/StudentSidebar";

// ------------------ MOCK DATA ------------------ //
const mockCounselors = [
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

const mockAppointments = [
  {
    id: "a1",
    counselorId: "c1",
    date: "2025-09-01",
    time: "10:00 AM",
    type: "video",
    status: "confirmed",
    isAnonymous: false,
  },
  {
    id: "a2",
    counselorId: "c2",
    date: "2025-09-03",
    time: "2:00 PM",
    type: "chat",
    status: "pending",
    note: "",
    isAnonymous: true,
  },
];

// ------------------ COMPONENT ------------------ //
export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState(mockAppointments);

  // FIX: Add missing states
  const [selectedCounselor, setSelectedCounselor] = useState<string | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<"video" | "chat" | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const today = new Date();
  const upcoming = appointments.filter((appt) => new Date(appt.date) >= today);
  const past = appointments.filter((appt) => new Date(appt.date) < today);

  const getCounselor = (id: string) => mockCounselors.find((c) => c.id === id);

  // FIX: Add missing handler
  const handleBookAppointment = () => {
    if (!selectedCounselor || !selectedDate || !selectedTime || !sessionType)
      return;

    const newAppointment = {
      id: `a${appointments.length + 1}`,
      counselorId: selectedCounselor,
      date: selectedDate,
      time: selectedTime,
      type: sessionType,
      status: "pending" as const,
      isAnonymous,
    };

    setAppointments([...appointments, newAppointment]);

    // reset form
    setSelectedCounselor(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setSessionType(null);
    setIsAnonymous(false);

    // optional: toast.success("Appointment booked successfully!");
  };

  return (
    <DashboardLayout title="Student Dashboard" sidebar={<StudentSidebar />}>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Appointments</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Book Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Book New Appointment</DialogTitle>
                <DialogDescription>
                  Choose a counselor and schedule your session
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Counselor Selection */}
                <div>
                  <label className="text-sm font-medium mb-3 block">
                    Select Counselor
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {mockCounselors.map((counselor) => (
                      <div
                        key={counselor.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedCounselor === counselor.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedCounselor(counselor.id)}
                      >
                        <div className="flex items-start space-x-4">
                          <Avatar>
                            <AvatarFallback>
                              {counselor.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium">{counselor.name}</h3>
                              <Badge variant="outline" className="text-xs">
                                {counselor.type}
                              </Badge>
                              {counselor.isOnline && (
                                <Badge
                                  variant="default"
                                  className="text-xs bg-green-600"
                                >
                                  Online
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-1 mt-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">
                                {counselor.rating}
                              </span>
                              <span className="text-sm text-gray-500">
                                ({counselor.totalSessions} sessions)
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">
                              {counselor.bio}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {counselor.specializations.map((spec) => (
                                <Badge
                                  key={spec}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Date & Time Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Date
                    </label>
                    <Select
                      value={selectedDate ?? ""}
                      onValueChange={setSelectedDate}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2025-09-01">Sept 1, 2025</SelectItem>
                        <SelectItem value="2025-09-02">Sept 2, 2025</SelectItem>
                        <SelectItem value="2025-09-03">Sept 3, 2025</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Time
                    </label>
                    <Select
                      value={selectedTime ?? ""}
                      onValueChange={setSelectedTime}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="09:00 AM">9:00 AM</SelectItem>
                        <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                        <SelectItem value="2:00 PM">2:00 PM</SelectItem>
                        <SelectItem value="4:00 PM">4:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Session Type */}
                <div>
                  <label className="text-sm font-medium mb-3 block">
                    Session Type
                  </label>
                  <div className="flex space-x-4">
                    <Button
                      variant={sessionType === "video" ? "default" : "outline"}
                      onClick={() => setSessionType("video")}
                      className="flex-1"
                    >
                      <Video className="mr-2 h-4 w-4" />
                      Video Call
                    </Button>
                    <Button
                      variant={sessionType === "chat" ? "default" : "outline"}
                      onClick={() => setSessionType("chat")}
                      className="flex-1"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Text Chat
                    </Button>
                  </div>
                </div>

                {/* Anonymous Option */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="anonymous" className="text-sm">
                    Book anonymously (counselor won't see your personal
                    information)
                  </label>
                </div>

                <Button
                  onClick={handleBookAppointment}
                  className="w-full"
                  disabled={
                    !selectedCounselor ||
                    !selectedDate ||
                    !selectedTime ||
                    !sessionType
                  }
                >
                  Book Appointment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* UPCOMING APPOINTMENTS */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>
              Stay prepared for your next sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No upcoming appointments.
              </p>
            ) : (
              upcoming.map((appt) => {
                const counselor = getCounselor(appt.counselorId);
                return (
                  <div
                    key={appt.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          {counselor?.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{counselor?.name}</p>
                        <div className="flex items-center text-sm text-muted-foreground space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{appt.date}</span>
                          <Clock className="h-4 w-4 ml-2" />
                          <span>{appt.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{appt.status}</Badge>
                      {appt.type === "video" ? (
                        <Video className="h-5 w-5 text-blue-500" />
                      ) : (
                        <MessageCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* PAST APPOINTMENTS */}
        <Card>
          <CardHeader>
            <CardTitle>Past Appointments</CardTitle>
            <CardDescription>Review your previous sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {past.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No past appointments.
              </p>
            ) : (
              past.map((appt) => {
                const counselor = getCounselor(appt.counselorId);
                return (
                  <div
                    key={appt.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          {counselor?.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{counselor?.name}</p>
                        <div className="flex items-center text-sm text-muted-foreground space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{appt.date}</span>
                          <Clock className="h-4 w-4 ml-2" />
                          <span>{appt.time}</span>
                        </div>
                        {appt.note && (
                          <p className="text-xs mt-1 text-muted-foreground">
                            Notes: {appt.note}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {appt.type === "video" ? (
                        <Video className="h-5 w-5 text-blue-500" />
                      ) : (
                        <MessageCircle className="h-5 w-5 text-green-500" />
                      )}
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
