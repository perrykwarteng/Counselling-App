"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/Context/AuthProvider";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

import {
  BadgeCheck,
  CheckCircle2,
  Mail,
  Phone,
  Shield,
  ShieldAlert,
  User2,
  Lock,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StudentSidebar } from "@/components/studentSidebar/StudentSidebar";

const API_BASE = (process.env.NEXT_PUBLIC_APP_BASE_URL || "").replace(
  /\/$/,
  ""
);
const API_UPDATE_PROFILE = `${API_BASE}/users/me`;
const API_CHANGE_PASSWORD = `${API_BASE}/auth/change-password`;
const API_DELETE_ACCOUNT = `${API_BASE}/users/me`;

function initialsFromName(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  const two = `${first}${second}`.toUpperCase();
  return two || (first || "U").toUpperCase();
}

// ✅ Always return a consistent headers type
const authHeader = (): Record<string, string> => {
  const headers: Record<string, string> = {};
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_access_token");
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [loading, user, router]);

  const initials = useMemo(() => initialsFromName(user?.name), [user?.name]);

  // Forms state
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [anon, setAnon] = useState<boolean>(!!user?.is_anonymous);

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setPhone(user.phone ?? "");
      setAnon(!!user.is_anonymous);
    }
  }, [user]);

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch(API_UPDATE_PROFILE, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(), // ✅ consistent headers
        },
        body: JSON.stringify({ name, phone, is_anonymous: anon }),
        credentials: "include",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to update profile");
      }
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error("Passwords do not match");
      return;
    }
    setSavingSecurity(true);
    try {
      const res = await fetch(API_CHANGE_PASSWORD, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(), // ✅ consistent headers
        },
        body: JSON.stringify({
          current_password: currentPwd,
          new_password: newPwd,
        }),
        credentials: "include",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to change password");
      }
      toast.success("Password updated");
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to change password");
    } finally {
      setSavingSecurity(false);
    }
  };

  const onDeleteAccount = async () => {
    if (!confirm("This action is irreversible. Delete your account?")) return;
    setDeleting(true);
    try {
      const res = await fetch(API_DELETE_ACCOUNT, {
        method: "DELETE",
        headers: {
          ...authHeader(), // ✅ consistent headers
        },
        credentials: "include",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to delete account");
      }
      toast.success("Account deleted");
      router.replace("/auth/register");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-4 border-gray-300 border-t-[#131b62] animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout title="Student Dashboard" sidebar={<StudentSidebar />}>
      <div className="space-y-6">
        {/* Header / Hero */}
        <section className="rounded-xl border bg-white">
          <div className="bg-gradient-to-r from-[#080e29] to-[#131b62] px-6 py-10 rounded-t-xl text-white">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-white/30">
                <AvatarFallback className="bg-white/10 text-white text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold">{user.name}</h1>
                <div className="flex items-center gap-2 text-sm">
                  <Badge
                    variant="secondary"
                    className="bg-white/10 text-white hover:bg-white/20"
                  >
                    {user.role}
                  </Badge>
                  {user.is_verified ? (
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 size={16} className="text-emerald-300" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <ShieldAlert size={16} className="text-yellow-300" />
                      Not verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Mail size={16} /> {user.email}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Phone size={16} /> {user.phone || "No phone on file"}
            </div>
          </div>
        </section>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList>
            <TabsTrigger value="profile" className="gap-1">
              <User2 size={16} /> Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1">
              <Lock size={16} /> Security
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-1">
              <Shield size={16} /> Preferences
            </TabsTrigger>
          </TabsList>

          {/* Profile */}
          <TabsContent value="profile" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your basic account details.
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <form onSubmit={onSaveProfile} className="grid gap-4 max-w-lg">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+233 20 000 0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input value={user.email} disabled />
                    <p className="text-xs text-muted-foreground">
                      Email changes are not supported here.
                    </p>
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div className="space-y-0.5">
                      <Label>Anonymous Mode</Label>
                      <p className="text-xs text-muted-foreground">
                        Hide your name in certain counseling interactions.
                      </p>
                    </div>
                    <Switch checked={anon} onCheckedChange={setAnon} />
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit" disabled={savingProfile}>
                      {savingProfile ? "Saving..." : "Save changes"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>Change your account password.</CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <form
                  onSubmit={onChangePassword}
                  className="grid gap-4 max-w-lg"
                >
                  <div className="grid gap-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPwd}
                      onChange={(e) => setCurrentPwd(e.target.value)}
                      autoComplete="current-password"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      minLength={8}
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      minLength={8}
                      value={confirmPwd}
                      onChange={(e) => setConfirmPwd(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit" disabled={savingSecurity}>
                      {savingSecurity ? "Updating..." : "Update password"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences */}
          <TabsContent value="preferences" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Preferences</CardTitle>
                <CardDescription>
                  Control how your account is presented.
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="grid gap-4 max-w-xl">
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div className="space-y-0.5">
                      <Label>Email Verified</Label>
                      <p className="text-xs text-muted-foreground">
                        Your email status with the platform.
                      </p>
                    </div>
                    {user.is_verified ? (
                      <Badge variant="secondary" className="gap-1">
                        <BadgeCheck size={14} /> Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline">Unverified</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div className="space-y-0.5">
                      <Label>Role</Label>
                      <p className="text-xs text-muted-foreground">
                        Assigned by admin.
                      </p>
                    </div>
                    <Badge variant="outline">{user.role}</Badge>
                  </div>
                </div>
              </CardContent>

              <Separator />
              <CardFooter className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle size={16} />
                  <span className="text-sm">Danger Zone</span>
                </div>
                <Button
                  variant="destructive"
                  onClick={onDeleteAccount}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete account"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
