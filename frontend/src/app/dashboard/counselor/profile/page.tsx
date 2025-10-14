"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/Context/AuthProvider";
import { useProfile } from "@/Context/ProfileProvider";
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
import { CounselorSidebar } from "@/components/counselorSidebar/CounselorSidebar";

// ---------------- Helpers ----------------
function initialsFromName(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return `${first}${second}`.toUpperCase() || (first || "U").toUpperCase();
}

// ---------------- Component ----------------
export default function CounselorProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    me,
    ensureLoaded,
    updateProfile,
    changePassword,
    deleteAccount,
    updating,
    changingPassword,
    deleting,
  } = useProfile();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth/login");
    }
  }, [authLoading, user, router]);

  // Load profile data
  useEffect(() => {
    if (user && ensureLoaded) void ensureLoaded();
  }, [user, ensureLoaded]);

  // Profile states (all as string to avoid type mismatch)
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [experience, setExperience] = useState("");
  const [anon, setAnon] = useState(false);

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  // Sync states when `me` loads
  useEffect(() => {
    if (me) {
      setName(me.name ?? "");
      setPhone(me.phone ?? "");
      setAnon(!!me.is_anonymous);
    }
  }, [me]);

  // Derived values
  const initials = useMemo(
    () => initialsFromName(me?.name || user?.name),
    [me?.name, user?.name]
  );

  const display = (me || user) as {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    is_verified?: boolean;
    is_anonymous?: boolean;
  };

  // ---------------- Handlers ----------------
  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      name,
      phone,
      is_anonymous: anon,
    });
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

    const ok = await changePassword({
      current_password: currentPwd,
      new_password: newPwd,
    });
    if (ok) {
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    }
  };

  const onDeleteAccount = async () => {
    if (!confirm("⚠️ This action is irreversible. Delete your account?"))
      return;
    const ok = await deleteAccount();
    if (ok) router.replace("/auth/register");
  };

  // ---------------- Loading State ----------------
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-4 border-gray-300 border-t-[#131b62] animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  // ---------------- Render ----------------
  return (
    <DashboardLayout title="Counselor Dashboard" sidebar={<CounselorSidebar />}>
      <div className="space-y-6">
        {/* Header */}
        <section className="rounded-xl border bg-white">
          <div className="bg-gradient-to-r from-[#080e29] to-[#131b62] px-6 py-10 rounded-t-xl text-white">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-white/30">
                <AvatarFallback className="bg-white/10 text-white text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold">{display.name}</h1>
                <div className="flex items-center gap-2 text-sm">
                  <Badge
                    variant="secondary"
                    className="bg-white/10 text-white hover:bg-white/20"
                  >
                    {display.role}
                  </Badge>
                  {display.is_verified ? (
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
              <Mail size={16} /> {display.email}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Phone size={16} /> {display.phone || "No phone on file"}
            </div>
          </div>
        </section>

        {/* Tabs */}
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

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your counselor account details.
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
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input
                      id="specialization"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      placeholder="e.g., Marriage Counseling"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input
                      id="experience"
                      type="number"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div className="space-y-0.5">
                      <Label>Anonymous Mode</Label>
                      <p className="text-xs text-muted-foreground">
                        Hide your name in certain counseling interactions.
                      </p>
                    </div>
                    <Switch
                      checked={anon}
                      onCheckedChange={(val: boolean) => setAnon(val)}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" disabled={updating}>
                      {updating ? "Saving..." : "Save changes"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
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
                      required
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
                      required
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
                      required
                      minLength={8}
                      value={confirmPwd}
                      onChange={(e) => setConfirmPwd(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" disabled={changingPassword}>
                      {changingPassword ? "Updating..." : "Update password"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Preferences</CardTitle>
                <CardDescription>
                  Control how your counselor account is presented.
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
                    {display.is_verified ? (
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
                    <Badge variant="outline">{display.role}</Badge>
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
                  {deleting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                      Deleting...
                    </div>
                  ) : (
                    "Delete account"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
