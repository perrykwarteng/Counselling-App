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
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  MessageCircle,
  Heart,
  BookOpen,
  TrendingUp,
  Clock,
  Star,
  AlertCircle,
} from "lucide-react";
import { StudentSidebar } from "@/components/studentSidebar/StudentSidebar";
// import { mockAppointments, mockMoodEntries, mockResources } from '@/lib/mock-data';

export default function StudentDashboard() {
  // const { user, loading } = useAuth();
  const router = useRouter();

  // useEffect(() => {
  //   if (!loading && (!user || user.role !== 'student')) {
  //     router.push('/');
  //   }
  // }, [user, loading, router]);

  // if (loading || !user) {
  //   return <div>Loading...</div>;
  // }

  // Mock data for the current student
  // const recentAppointments = mockAppointments.filter(apt => apt.studentId === user.id).slice(0, 3);
  // const recentMoods = mockMoodEntries.filter(mood => mood.studentId === user.id).slice(0, 5);
  // const currentMood = recentMoods[0]?.mood || 7;
  // const moodTrend = recentMoods.length > 1 ?
  //   (recentMoods[0].mood - recentMoods[1].mood) : 0;

  // const weeklyProgress = {
  //   sessions: 2,
  //   moodEntries: 5,
  //   resourcesViewed: 3,
  //   target: 7
  // };

  return (
    <DashboardLayout title="Student Dashboard" sidebar={<StudentSidebar />}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-slate-900 to-blue-500 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">
            {/* Welcome back, {user.firstName}! */}
            Welcome back, Name
          </h2>
          <p className="text-blue-100">
            How are you feeling today? Remember, taking care of your mental
            health is just as important as your physical health.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Current Mood
              </CardTitle>
              <Heart className="h-4 w-4 text-pink-600" />
            </CardHeader>
            <CardContent>
              {/* <div className="text-2xl font-bold">{currentMood}/10</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className={`mr-1 h-3 w-3 ${moodTrend >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                {moodTrend >= 0 ? '+' : ''}{moodTrend} from yesterday
              </div> */}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Upcoming Sessions
              </CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {/* <div className="text-2xl font-bold">{recentAppointments.length}</div> */}
              <p className="text-xs text-muted-foreground">
                Next session in 2 days
              </p>
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
                Resources Viewed
              </CardTitle>
              <BookOpen className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              {/* <div className="text-2xl font-bold">{weeklyProgress.resourcesViewed}</div> */}
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>
        </div>

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
            {/* <CardContent className="space-y-4">
              {recentAppointments.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming appointments</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => router.push('/student/find-counselor')}
                  >
                    Book Appointment
                  </Button>
                </div>
              ) : (
                <>
                  {recentAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">{appointment.topic}</p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.date.toLocaleDateString()} at {appointment.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>
                      <Badge variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}>
                        {appointment.status}
                      </Badge>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push('/student/appointments')}
                  >
                    View All Appointments
                  </Button>
                </>
              )}
            </CardContent> */}
          </Card>

          {/* recent Notifications */}
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
            {/* <CardContent className="space-y-4">
              {recentAppointments.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming appointments</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => router.push('/student/find-counselor')}
                  >
                    Book Appointment
                  </Button>
                </div>
              ) : (
                <>
                  {recentAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">{appointment.topic}</p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.date.toLocaleDateString()} at {appointment.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>
                      <Badge variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}>
                        {appointment.status}
                      </Badge>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push('/student/appointments')}
                  >
                    View All Appointments
                  </Button>
                </>
              )}
            </CardContent> */}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
