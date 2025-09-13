"use client";

import {
  JSXElementConstructor,
  Key,
  ReactElement,
  ReactNode,
  ReactPortal,
  useEffect,
} from "react";
// import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
// import { AdminSidebar } from '@/components/admin/AdminSidebar';
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
  Users,
  UserCheck,
  AlertTriangle,
  BookOpen,
  TrendingUp,
  Activity,
  Shield,
  FileText,
  Clock,
  Star,
} from "lucide-react";
// import { mockSystemAnalytics, mockEmergencyAlerts, mockStudents, mockCounselors, mockResources } from '@/lib/mock-data';
import { AdminSidebar } from "@/components/adminSidebar/AdminSidebar";

export default function AdminDashboard() {
  // const { user, loading } = useAuth();
  const router = useRouter();

  // useEffect(() => {
  //   if (!loading && (!user || user.role !== 'admin')) {
  //     router.push('/');
  //   }
  // }, [user, loading, router]);

  // if (loading || !user) {
  //   return <div>Loading...</div>;
  // }

  // const analytics = mockSystemAnalytics;
  // const activeAlerts = mockEmergencyAlerts.filter(alert => !alert.isResolved);
  // const recentStudents = mockStudents.slice(0, 5);
  // const topCounselors = mockCounselors.sort((a, b) => b.rating - a.rating).slice(0, 3);

  // const systemHealth = {
  //   uptime: '99.9%',
  //   responseTime: '150ms',
  //   activeUsers: analytics.activeUsers,
  //   totalSessions: analytics.totalSessions
  // };

  return (
    <DashboardLayout title="Admin Dashboard" sidebar={<AdminSidebar />}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-slate-900 to-blue-500 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">System Overview</h2>
          <p className="text-purple-100">
            {/* {activeAlerts.length} priority alerts • {analytics.activeUsers} active users • System running smoothly */}
          </p>
        </div>

        {/* Critical Alerts */}
        {/* {activeAlerts.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                Critical Alerts ({activeAlerts.length})
              </CardTitle>
              <CardDescription className="text-red-700">
                Require immediate administrative attention
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeAlerts.slice(0, 3).map((alert: { id: Key | null | undefined; severity: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; type: string; message: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; timestamp: { toLocaleString: () => string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }; }) => (
                <div key={alert.id} className="flex items-start justify-between p-3 bg-white rounded-lg border border-red-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="destructive" className="text-xs">
                        {alert.severity}
                      </Badge>
                      <span className="text-sm font-medium">
                        {alert.type === 'mood' ? 'Low Mood Alert' : 'Keyword Alert'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {alert.timestamp.toLocaleString()}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => router.push('/admin/alerts')}>
                    Review
                  </Button>
                </div>
              ))}
              {activeAlerts.length > 3 && (
                <Button variant="outline" className="w-full" onClick={() => router.push('/admin/alerts')}>
                  View All {activeAlerts.length} Alerts
                </Button>
              )}
            </CardContent>
          </Card>
        )} */}

        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {/* <div className="text-2xl font-bold">{analytics.totalUsers}</div> */}
              <p className="text-xs text-muted-foreground">
                {/* {analytics.activeUsers} active this week */}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Counselors</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {/* <div className="text-2xl font-bold">{mockCounselors.length}</div> */}
              <p className="text-xs text-muted-foreground">
                {/* {mockCounselors.filter(c => c.isAvailable).length} available now */}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Sessions
              </CardTitle>
              <Activity className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              {/* <div className="text-2xl font-bold">{analytics.totalSessions}</div> */}
              <p className="text-xs text-muted-foreground">
                {/* Avg rating: {analytics.averageRating}/5 */}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                System Health
              </CardTitle>
              <Shield className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Healthy</div>
              <p className="text-xs text-muted-foreground">
                {/* {systemHealth.uptime} uptime */}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Top Counselors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Top Performing Counselors
              </CardTitle>
              <CardDescription>
                Highest rated counselors this month
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* {topCounselors.map((counselor, index) => (
                <div key={counselor.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-yellow-700">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {counselor.firstName} {counselor.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {counselor.totalSessions} sessions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{counselor.rating}</span>
                  </div>
                </div>
              ))} */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/admin/counselors")}
              >
                View All Counselors
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* System Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              System Performance
            </CardTitle>
            <CardDescription>
              Real-time system metrics and health indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {/* {systemHealth.uptime} */}
                </div>
                <p className="text-sm text-muted-foreground">Uptime</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {/* {systemHealth.responseTime} */}
                </div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {/* {systemHealth.activeUsers} */}
                </div>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">0</div>
                <p className="text-sm text-muted-foreground">System Errors</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
