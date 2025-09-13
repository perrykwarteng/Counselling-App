"use client";

import { useEffect } from "react";
// import { useAuth } from '@/contexts/AuthContext';
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
  Calendar,
  MessageCircle,
  Users,
  Clock,
  TrendingUp,
  Star,
  AlertTriangle,
  CheckCircle,
  User,
  FileText,
} from "lucide-react";
import { CounselorSidebar } from "@/components/counselorSidebar/CounselorSidebar";
// import { mockAppointments, mockStudents, mockEmergencyAlerts } from '@/lib/mock-data';

export default function CounselorDashboard() {
  // const { user, loading } = useAuth();
  const router = useRouter();

  // useEffect(() => {
  //   if (!loading && (!user || user.role !== 'counselor')) {
  //     router.push('/');
  //   }
  // }, [user, loading, router]);

  // if (loading || !user) {
  //   return <div>Loading...</div>;
  // }

  // Mock data for the current counselor
  // const counselorAppointments = mockAppointments.filter(apt => apt.counselorId === user.id);
  // const todayAppointments = counselorAppointments.filter(apt =>
  //   apt.date.toDateString() === new Date().toDateString()
  // );
  // const upcomingAppointments = counselorAppointments.filter(apt =>
  //   apt.date > new Date()
  // ).slice(0, 5);

  // const assignedStudents = mockStudents.slice(0, 3); // Mock assigned students
  // const emergencyAlerts = mockEmergencyAlerts.filter(alert => !alert.isResolved);

  const stats = {
    totalStudents: 28,
    activeStudents: 18,
    completedSessions: 156,
    averageRating: 4.8,
    responseTime: "< 2 hours",
  };

  return (
    <DashboardLayout title="Counselor Dashboard" sidebar={<CounselorSidebar />}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-slate-900 to-blue-500 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">
            {/* Welcome, Dr. {user.firstName}! */}
          </h2>
          <p className="text-green-100">
            {/* You have {todayAppointments.length} appointments today and {emergencyAlerts.length} priority alerts to review. */}
          </p>
        </div>

        {/* Emergency Alerts */}
        {/* {emergencyAlerts.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                Priority Alerts ({emergencyAlerts.length})
              </CardTitle>
              <CardDescription className="text-red-700">
                Students requiring immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {emergencyAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start justify-between p-3 bg-white rounded-lg border border-red-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="destructive" className="text-xs">
                        {alert.severity}
                      </Badge>
                      <span className="text-sm font-medium">
                        Student #{alert.studentId.slice(-4)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {alert.timestamp.toLocaleString()}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => router.push('/counselor/students')}>
                    Review
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )} */}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
              <Calendar className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {/* <div className="text-2xl font-bold">{todayAppointments.length}</div> */}
              <p className="text-xs text-muted-foreground">
                {/* {upcomingAppointments.length} more scheduled */}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRating}/5</div>
              <p className="text-xs text-muted-foreground">
                Based on {stats.completedSessions} sessions
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Schedule
              </CardTitle>
              <CardDescription>
                Your appointments for {new Date().toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* {todayAppointments.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No appointments today</p>
                  <p className="text-sm">Enjoy your free day!</p>
                </div>
              ) : (
                <>
                  {todayAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">
                            {appointment.isAnonymous ? 'Anonymous Student' : `Student #${appointment.studentId.slice(-4)}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {appointment.topic}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={appointment.type === 'video' ? 'default' : 'secondary'}>
                          {appointment.type}
                        </Badge>
                        <Button size="sm" variant="outline">
                          {appointment.type === 'video' ? 'Join' : 'Chat'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </>
              )} */}
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
              {/* {assignedStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={student.avatar} />
                      <AvatarFallback>
                        {student.anonymousMode ? 'A' : `${student.firstName[0]}${student.lastName[0]}`}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {student.anonymousMode ? 'Anonymous Student' : `${student.firstName} ${student.lastName}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Last session: 2 days ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Active</span>
                  </div>
                </div>
              ))} */}
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

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                className="h-20 flex flex-col gap-2"
                onClick={() => router.push("/counselor/appointments")}
              >
                <Calendar className="h-6 w-6" />
                Manage Schedule
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2"
                onClick={() => router.push("/counselor/messages")}
              >
                <MessageCircle className="h-6 w-6" />
                Check Messages
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2"
                onClick={() => router.push("/counselor/students")}
              >
                <Users className="h-6 w-6" />
                Student Progress
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2"
                onClick={() => router.push("/counselor/reports")}
              >
                <FileText className="h-6 w-6" />
                Session Notes
              </Button>
            </div>
          </CardContent>
        </Card>

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
