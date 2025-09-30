"use client";

import { ReactNode, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut as LogOutIcon, Settings, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/Context/AuthProvider";

interface DashboardLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  title: string;
}

function initialsFromName(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  const two = `${first}${second}`.toUpperCase();
  return two || (first || "U").toUpperCase();
}

export function DashboardLayout({
  children,
  sidebar,
  title,
}: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const initials = useMemo(() => initialsFromName(user?.name), [user?.name]);

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  return (
    // Use column layout and hide page overflow; let inner panes scroll
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-600">ATU Counselling Platform</p>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.name ?? "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email ?? ""}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push("dashboad/student/profile")}
                >
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOutIcon className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Body: min-h-0 is crucial so children can scroll without causing page overflow */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar can scroll if it’s long */}
        <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          {sidebar}
        </aside>

        {/* Main content scrolls; hide horizontal overflow */}
        <main className="flex-1 p-6 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
