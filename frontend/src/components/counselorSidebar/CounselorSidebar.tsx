"use client";

import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MessageCircle,
  Users,
  BarChart3,
  User,
  VideoIcon,
  FileText,
  UserPlus,
  Clock,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard/counselor", icon: BarChart3 },
  {
    name: "Appointments",
    href: "/dashboard/counselor/appointments",
    icon: Calendar,
  },
  { name: "Students", href: "/dashboard/counselor/students", icon: Users },
  {
    name: "Messages",
    href: "/dashboard/counselor/messages",
    icon: MessageCircle,
  },
  { name: "Sessions", href: "/dashboard/counselor/sessions", icon: VideoIcon },
  { name: "Reports", href: "/dashboard/counselor/reports", icon: FileText },
  { name: "Referrals", href: "/dashboard/counselor/referrals", icon: UserPlus },
  { name: "Schedule", href: "/dashboard/counselor/schedule", icon: Clock },
  { name: "Profile", href: "/dashboard/counselor/profile", icon: User },
];

export function CounselorSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="flex flex-col p-4 space-y-2">
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Button
            key={item.name}
            variant={isActive ? "secondary" : "ghost"}
            className={cn(
              "justify-start gap-3 text-left",
              isActive &&
                "bg-gradient-to-r from-[#080e29] to-[#131b62] text-white hover:bg-blue-100"
            )}
            onClick={() => router.push(item.href)}
          >
            <Icon className="h-4 w-4" />
            {item.name}
          </Button>
        );
      })}
    </nav>
  );
}
