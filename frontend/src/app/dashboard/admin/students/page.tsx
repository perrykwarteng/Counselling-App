"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminSidebar } from "@/components/adminSidebar/AdminSidebar";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Modal } from "@/components/Modal/modal";
import { cn } from "@/lib/utils";

/* UI */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* Icons */
import {
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  UserCheck2,
  UserX2,
  RotateCw,
} from "lucide-react";

/* Notifications */
import { toast } from "sonner";

/* Provider + Types */
import {
  useAdminStudents,
  type Student,
  type CreateStudentInput,
  type UpdateStudentInput,
} from "../../../../Context/AdminStudentrProvider";

/* ------------------ SMALL FORM ------------------ */
function StudentForm({
  initial,
  onSubmit,
  submitLabel = "Save",
}: {
  initial: Partial<Student>;
  onSubmit: (data: CreateStudentInput | UpdateStudentInput) => void;
  submitLabel?: string;
}) {
  const [name, setName] = useState(initial.name ?? "");
  const [email, setEmail] = useState(initial.email ?? "");
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [department, setDepartment] = useState(initial.department ?? "");
  const [level, setLevel] = useState(initial.level ?? "");
  const [verified, setVerified] = useState<boolean>(
    initial.is_verified ?? false
  );
  const [anonymous, setAnonymous] = useState<boolean>(
    initial.is_anonymous ?? false
  );
  const [active, setActive] = useState<boolean>(initial.is_active ?? true);

  const canSubmit = name.trim().length > 0 && email.trim().length > 0;

  return (
    <div className="grid gap-5 sm:gap-6">
      <div className="grid gap-2">
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Kojo Owusu"
          data-autofocus
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+23320XXXXXXX"
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="dept">Department</Label>
          <Input
            id="dept"
            placeholder="e.g., Computer Science"
            value={department ?? ""}
            onChange={(e) => setDepartment(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="level">Level</Label>
          <Input
            id="level"
            placeholder="e.g., Level 300"
            value={level ?? ""}
            onChange={(e) => setLevel(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <Label className="font-medium">Verified</Label>
            <p className="text-xs text-muted-foreground">
              Email/identity verified
            </p>
          </div>
          <Switch checked={verified} onCheckedChange={(v) => setVerified(v)} />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <Label className="font-medium">Anonymous</Label>
            <p className="text-xs text-muted-foreground">
              Hide identity from counselors
            </p>
          </div>
          <Switch
            checked={anonymous}
            onCheckedChange={(v) => setAnonymous(v)}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <Label className="font-medium">Active</Label>
            <p className="text-xs text-muted-foreground">
              Can log in and book sessions
            </p>
          </div>
          <Switch checked={active} onCheckedChange={(v) => setActive(v)} />
        </div>
      </div>

      <Button
        className="w-full rounded-2xl"
        disabled={!canSubmit}
        onClick={() =>
          onSubmit({
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim() || undefined,
            is_verified: verified,
            is_anonymous: anonymous,
            profile: {
              department: department.trim() || null,
              level: level.trim() || null,
            },
            is_active: active,
          })
        }
      >
        {submitLabel}
      </Button>
    </div>
  );
}

/* ------------------ PAGE BODY ------------------ */
function StudentsInner() {
  const {
    items,
    loading,
    error,
    query,
    setQuery,
    refetch,
    update,
    toggleActive,
    remove,
    create,
  } = useAdminStudents();

  const [openView, setOpenView] = useState<null | Student>(null);
  const [openEdit, setOpenEdit] = useState<null | Student>(null);
  const [openDelete, setOpenDelete] = useState<null | Student>(null);
  const [openCreate, setOpenCreate] = useState<boolean>(false);

  // Filters
  const [deptFilter, setDeptFilter] = useState<"all" | string>("all");
  const [levelFilter, setLevelFilter] = useState<"all" | string>("all");
  const [verifyFilter, setVerifyFilter] = useState<
    "all" | "verified" | "unverified"
  >("all");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<5 | 10 | 20>(10);

  const departments = useMemo(() => {
    const s = new Set<string>();
    items.forEach((r) => r.department && s.add(r.department));
    return Array.from(s).sort();
  }, [items]);

  const levels = useMemo(() => {
    const s = new Set<string>();
    items.forEach((r) => r.level && s.add(r.level));
    return Array.from(s).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items
      .filter((r) => {
        if (deptFilter !== "all" && (r.department || "") !== deptFilter)
          return false;
        if (levelFilter !== "all" && (r.level || "") !== levelFilter)
          return false;
        if (verifyFilter !== "all") {
          const want = verifyFilter === "verified";
          if (r.is_verified !== want) return false;
        }
        if (activeFilter !== "all") {
          const want = activeFilter === "active";
          if (r.is_active !== want) return false;
        }
        if (!q) return true;
        return (
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          (r.phone || "").toLowerCase().includes(q)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }, [items, query, deptFilter, levelFilter, verifyFilter, activeFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, total);
  const pageRows = filtered.slice(start, end);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Helpers
  const initials = (fullName: string) =>
    fullName
      .split(" ")
      .filter(Boolean)
      .map((n: string) => n[0] ?? "")
      .join("")
      .slice(0, 3);

  // Actions with toasts
  async function handleCreate(payload: CreateStudentInput) {
    const t = toast.loading("Creating student...");
    try {
      const res = await create(payload);
      if (res) {
        toast.success("Student created", { id: t });
        setOpenCreate(false);
      } else {
        toast.error("Failed to create student", { id: t });
      }
    } catch {
      toast.error("Failed to create student", { id: t });
    }
  }

  async function handleUpdate(id: string, payload: UpdateStudentInput) {
    const t = toast.loading("Saving changes...");
    try {
      const res = await update(id, payload);
      if (res) {
        toast.success("Student updated", { id: t });
        setOpenEdit(null);
      } else {
        toast.error("Failed to update student", { id: t });
      }
    } catch {
      toast.error("Failed to update student", { id: t });
    }
  }

  async function handleDeleteConfirm(id: string) {
    const t = toast.loading("Deleting student...");
    try {
      const ok = await remove(id);
      if (ok) {
        toast.success("Student deleted", { id: t });
        setOpenDelete(null);
      } else {
        toast.error("Failed to delete student", { id: t });
      }
    } catch {
      toast.error("Failed to delete student", { id: t });
    }
  }

  async function handleRefresh() {
    const t = toast.loading("Refreshing...");
    try {
      await refetch();
      toast.success("List refreshed", { id: t });
    } catch {
      toast.error("Failed to refresh", { id: t });
    }
  }

  async function tryToggleActive(id: string, v: boolean) {
    const t = toast.loading(v ? "Activating..." : "Deactivating...");
    const ok = await toggleActive(id, v);
    toast.dismiss(t);
    if (ok) {
      toast.success(v ? "Student activated" : "Student deactivated");
    } else {
      toast.error("Failed to change active status");
    }
  }

  return (
    <DashboardLayout title="Students" sidebar={<AdminSidebar />}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Students</h1>
            <p className="text-sm text-muted-foreground">
              Browse and manage student accounts
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RotateCw
                className={cn("h-4 w-4 mr-1", loading && "animate-spin")}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filters</CardTitle>
            <CardDescription>Search and refine the list</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email or phone"
                className="pl-8"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <Select
              value={deptFilter}
              onValueChange={(v) => {
                setDeptFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={levelFilter}
              onValueChange={(v) => {
                setLevelFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                {levels.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-2 md:col-span-2">
              <Select
                value={verifyFilter}
                onValueChange={(v: "all" | "verified" | "unverified") => {
                  setVerifyFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Verification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={activeFilter}
                onValueChange={(v: "all" | "active" | "inactive") => {
                  setActiveFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Active status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-base">All Students</CardTitle>
            <CardDescription>
              Manage enrollment, verification, and status
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[220px]">Student</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Dept / Level</TableHead>
                    <TableHead>Flags</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : pageRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No students found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageRows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {initials(r.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="font-medium truncate">
                                {r.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Joined{" "}
                                {new Date(r.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="truncate">{r.email}</TableCell>
                        <TableCell className="truncate">
                          {r.phone || "—"}
                        </TableCell>
                        <TableCell className="truncate">
                          <div className="flex flex-col">
                            <span>{r.department || "—"}</span>
                            <span className="text-xs text-muted-foreground">
                              {r.level || "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                r.is_verified
                                  ? "border-green-500 text-green-700"
                                  : "border-amber-500 text-amber-700"
                              )}
                            >
                              {r.is_verified ? "Verified" : "Unverified"}
                            </Badge>
                            {r.is_anonymous && (
                              <Badge variant="outline" className="text-xs">
                                Anonymous
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "h-2 w-2 rounded-full",
                                r.is_active ? "bg-green-500" : "bg-gray-300"
                              )}
                            />
                            <Switch
                              checked={r.is_active}
                              onCheckedChange={(v) => tryToggleActive(r.id, v)}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl"
                              onClick={() => setOpenView(r)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl"
                              onClick={() => setOpenEdit(r)}
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="rounded-xl"
                              onClick={() => setOpenDelete(r)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                {total > 0 ? (
                  <>
                    Showing {start + 1}–{end} of {total}
                  </>
                ) : (
                  <>Showing 0 of 0</>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">
                    Per page
                  </span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => {
                      const size = Number(v) as 5 | 10 | 20;
                      setPageSize(size);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[72px]">
                      <SelectValue placeholder={pageSize} />
                    </SelectTrigger>
                    <SelectContent align="end" className="w-[72px]">
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="min-w-[56px] text-center text-xs text-muted-foreground">
                    {page} / {totalPages}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Modal */}
      <Modal
        open={!!openView}
        onClose={() => setOpenView(null)}
        title="Student Details"
        description={openView?.name}
        footer={
          <div className="flex gap-2">
            <Button
              variant={openView?.is_verified ? "outline" : "default"}
              className="flex-1 rounded-xl"
              onClick={async () => {
                if (!openView) return;
                const t = toast.loading(
                  openView.is_verified
                    ? "Marking unverified..."
                    : "Verifying..."
                );
                const res = await update(openView.id, {
                  is_verified: !openView.is_verified,
                });
                toast.dismiss(t);
                if (res) {
                  toast.success(
                    !openView.is_verified
                      ? "Student verified"
                      : "Marked as unverified"
                  );
                } else {
                  toast.error("Failed to update verification");
                }
              }}
            >
              {openView?.is_verified ? (
                <>
                  <UserX2 className="h-4 w-4 mr-1" />
                  Mark Unverified
                </>
              ) : (
                <>
                  <UserCheck2 className="h-4 w-4 mr-1" />
                  Verify
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => {
                if (openView) {
                  setOpenEdit(openView);
                  setOpenView(null);
                }
              }}
            >
              Edit
            </Button>
          </div>
        }
      >
        {openView && (
          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{initials(openView.name)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{openView.name}</div>
                <div className="text-xs text-muted-foreground">
                  Joined {new Date(openView.created_at).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid gap-1">
              <span className="text-muted-foreground">Email</span>
              <span>{openView.email}</span>
            </div>

            <div className="grid gap-1">
              <span className="text-muted-foreground">Phone</span>
              <span>{openView.phone || "—"}</span>
            </div>

            <div className="grid gap-1">
              <span className="text-muted-foreground">Department / Level</span>
              <span>
                {openView.department || "—"}{" "}
                {openView.level ? `• ${openView.level}` : ""}
              </span>
            </div>

            <div className="flex flex-wrap gap-1">
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  openView.is_verified
                    ? "border-green-500 text-green-700"
                    : "border-amber-500 text-amber-700"
                )}
              >
                {openView.is_verified ? "Verified" : "Unverified"}
              </Badge>
              {openView.is_anonymous && (
                <Badge variant="outline" className="text-xs">
                  Anonymous
                </Badge>
              )}
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  openView.is_active
                    ? "border-green-500 text-green-700"
                    : "border-gray-400 text-gray-700"
                )}
              >
                {openView.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!openEdit}
        onClose={() => setOpenEdit(null)}
        title="Edit Student"
        description={openEdit?.name}
        footer={null}
      >
        {openEdit && (
          <StudentForm
            initial={openEdit}
            submitLabel="Save Changes"
            onSubmit={(data) =>
              handleUpdate(openEdit.id, data as UpdateStudentInput)
            }
          />
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={!!openDelete}
        onClose={() => setOpenDelete(null)}
        title="Delete Student"
        description="This action cannot be undone."
        footer={
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setOpenDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl"
              onClick={() => openDelete && handleDeleteConfirm(openDelete.id)}
            >
              Delete
            </Button>
          </div>
        }
      >
        <div className="text-sm">
          Are you sure you want to delete{" "}
          <span className="font-medium">{openDelete?.name}</span>? They will
          lose access and their data may be removed.
        </div>
      </Modal>
    </DashboardLayout>
  );
}

export default function StudentsPage() {
  return <StudentsInner />;
}
