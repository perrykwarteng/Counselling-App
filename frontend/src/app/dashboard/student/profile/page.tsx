"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Edit,
  User,
  Video,
  MessageCircle,
} from "lucide-react";
import { StudentSidebar } from "@/components/studentSidebar/StudentSidebar";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

const mockUser = {
  id: "u1",
  name: "Perry Kwarteng",
  email: "perry@example.com",
  phone: "+233 54 123 4567",
  bio: "Passionate about technology and personal growth. Loves learning and helping others.",
  totalSessions: 8,
  upcoming: 2,
  completed: 6,
};

const mockAppointments = [
  {
    id: "a1",
    date: "2025-09-01",
    time: "10:00 AM",
    type: "video",
    counselor: "Dr. Ama Mensah",
    status: "confirmed",
  },
  {
    id: "a2",
    date: "2025-08-20",
    time: "3:30 PM",
    type: "chat",
    counselor: "Mr. Kwesi Ofori",
    status: "completed",
  },
  {
    id: "a3",
    date: "2025-08-10",
    time: "12:00 PM",
    type: "video",
    counselor: "Dr. Grace Owusu",
    status: "completed",
  },
];

export default function ProfilePage() {
  return (
    <DashboardLayout title="Student Dashboard" sidebar={<StudentSidebar />}>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="flex flex-col md:flex-row items-center md:items-start gap-6 p-6">
            <Avatar className="h-24 w-24">
              <AvatarFallback>PK</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2 text-center md:text-left">
              <h2 className="text-2xl font-bold">{mockUser.name}</h2>
              <p className="text-sm text-gray-500">{mockUser.email}</p>
              <p className="text-sm text-gray-500">{mockUser.phone}</p>
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Edit className="h-4 w-4" /> Edit Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
