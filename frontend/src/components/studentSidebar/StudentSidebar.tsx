"use client";

import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MessageCircle,
  Heart,
  BookOpen,
  User,
  BarChart3,
  Brain,
  VideoIcon,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard/student", icon: BarChart3 },
  // {
  //   name: "Find Counselor",
  //   href: "/dashboard/student/find-counselor",
  //   icon: Brain,
  // },
  {
    name: "Appointments",
    href: "/dashboard/student/appointments",
    icon: Calendar,
  },
  {
    name: "Messages",
    href: "/dashboard/student/messages",
    icon: MessageCircle,
  },
  { name: "Resources", href: "/dashboard/student/resources", icon: BookOpen },
  { name: "Profile", href: "/dashboard/student/profile", icon: User },
];

export function StudentSidebar() {
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
