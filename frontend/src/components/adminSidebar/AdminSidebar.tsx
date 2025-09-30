"use client";

import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  UserCheck,
  BookOpen,
  FileText,
  User,
  UserPlus,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard/admin", icon: BarChart3 },
  { name: "Counselors", href: "/dashboard/admin/counselors", icon: UserCheck },
  { name: "Students", href: "/dashboard/admin/students", icon: User },
  { name: "Resources", href: "/dashboard/admin/resources", icon: BookOpen },
  { name: "Referrals", href: "/dashboard/admin/referrals", icon: UserPlus },
  { name: "System Logs", href: "/dashboard/admin/logs", icon: FileText },
];

export function AdminSidebar() {
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
                "bg-gradient-to-r from-[#080e29] to-[#131b62] text-white hover:bg-purple-100"
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
