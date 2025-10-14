"use client";

import { useEffect, useMemo } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar as CalendarIcon,
  MessageCircle,
  Users,
  Clock,
  TrendingUp,
} from "lucide-react";
import { CounselorSidebar } from "@/components/counselorSidebar/CounselorSidebar";
import { useAppointments } from "@/Context/AppointmentProviders";
import {
  AdminStudentsProvider,
  useAdminStudents,
} from "@/Context/AdminStudentrProvider";

function CounselorDashboardInner() {
  const router = useRouter();
  const { appointments, listMyAppointments } = useAppointments();
  const { items: students, refetch: listMyStudents } = useAdminStudents();

  useEffect(() => {
    listMyAppointments?.();
    listMyStudents?.();
  }, [listMyAppointments, listMyStudents]);

  // Today's appointments
  const todayAppointments = useMemo(() => {
    const today = new Date().toDateString();
    return (appointments ?? []).filter(
      (apt) =>
        new Date(apt.scheduled_at).toDateString() === today &&
        apt.status === "accepted"
    );
  }, [appointments]);

  // Upcoming
  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return (appointments ?? [])
      .filter(
        (apt) => new Date(apt.scheduled_at) > now && apt.status === "accepted"
      )
      .slice(0, 5);
  }, [appointments]);

  // Stats
  const stats = {
    totalStudents: students?.length ?? 0,
    activeStudents: students?.filter((s) => s.is_active).length ?? 0,
    completedSessions: (appointments ?? []).filter(
      (a) => a.status === "completed"
    ).length,
    averageRating: 4.8, // placeholder
    responseTime: "< 2 hours", // placeholder
  };

  return (
    <DashboardLayout title="Counselor Dashboard" sidebar={<CounselorSidebar />}>
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Students
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeStudents} active this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Today's Sessions
              </CardTitle>
              <CalendarIcon className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayAppointments.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {upcomingAppointments.length} more upcoming
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Response Time
              </CardTitle>
              <Clock className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.responseTime}</div>
              <p className="text-xs text-muted-foreground">
                Average response time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Unread Messages
              </CardTitle>
              <MessageCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground">From 4 students</p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Today's Schedule
              </CardTitle>
              <CardDescription>
                Your appointments for {new Date().toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {todayAppointments.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No appointments today</p>
                  <p className="text-sm">Enjoy your free day!</p>
                </div>
              ) : (
                todayAppointments.map((appointment: any) => (
                  <div
                    key={appointment._id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        Student #{appointment.studentId?.slice(-4)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(appointment.scheduled_at).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" }
                        )}{" "}
                        • {appointment.mode}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{appointment.mode}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          router.push(
                            `/counselor/appointments/${appointment._id}`
                          )
                        }
                      >
                        Join
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Students */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recent Students
              </CardTitle>
              <CardDescription>
                Students you've worked with recently
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(students ?? []).slice(0, 3).map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={"/placeholder.png"} />
                      <AvatarFallback>
                        {student.name?.[0] ?? "S"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Last session: 2 days ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        student.is_active ? "bg-green-500" : "bg-gray-400"
                      }`}
                    ></div>
                    <span className="text-sm">
                      {student.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/counselor/students")}
              >
                View All Students
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              This Month's Summary
            </CardTitle>
            <CardDescription>
              Your counseling activity and impact
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {stats.completedSessions}
                </div>
                <p className="text-sm text-muted-foreground">
                  Sessions Completed
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">94%</div>
                <p className="text-sm text-muted-foreground">
                  Student Satisfaction
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {stats.activeStudents}
                </div>
                <p className="text-sm text-muted-foreground">Active Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function CounselorDashboard() {
  return (
    <AdminStudentsProvider>
      <CounselorDashboardInner />
    </AdminStudentsProvider>
  );
}
