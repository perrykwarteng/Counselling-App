"use client";

import { useCallback, useMemo, useState, useEffect } from "react";

import { AdminSidebar } from "@/components/adminSidebar/AdminSidebar";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Modal } from "@/components/Modal/modal";
import { cn } from "@/lib/utils";

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

import { Search, Pencil, Trash2, UserPlus2 } from "lucide-react";

import {
  useAdminCounselors,
  type Counselor,
} from "@/Context/AdminCounselorProvider";

import { Toaster, toast } from "sonner";

type CounselorType = "academic" | "professional";
type FormPayload = {
  name: string;
  email: string;
  phone?: string;
  counselor_type: CounselorType;
  is_active: boolean;
};

const getInitials = (name: string) =>
  (name ?? "")
    .trim()
    .split(/\s+/)
    .map((part: string) => part.charAt(0))
    .join("")
    .toUpperCase();

const formatDateTime = (iso?: string) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
};

function CounselorForm({
  initial,
  onSubmit,
  submitLabel = "Save",
  busy,
}: {
  initial?: Partial<FormPayload> & {
    name?: string;
    email?: string;
    phone?: string;
  };
  onSubmit: (data: FormPayload) => void | Promise<void>;
  submitLabel?: string;
  busy?: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [type, setType] = useState<CounselorType>(
    (initial?.counselor_type as CounselorType) ?? "academic"
  );
  const [active, setActive] = useState<boolean>(initial?.is_active ?? true);

  const canSubmit = name.trim() && email.trim();

  return (
    <div className="grid gap-5 sm:gap-6">
      <div className="grid gap-2">
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Dr. Ama Mensah"
          data-autofocus
          disabled={busy}
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
          disabled={busy}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+233201234567"
          disabled={busy}
        />
      </div>

      <div className="grid gap-2">
        <Label>Type</Label>
        <Select
          value={type}
          onValueChange={(v) => setType(v as CounselorType)}
          disabled={busy}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="academic">Academic</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="space-y-0.5">
          <Label className="font-medium">Active</Label>
          <p className="text-xs text-muted-foreground">
            Inactive counselors won’t appear in student booking.
          </p>
        </div>
        <Switch checked={active} onCheckedChange={setActive} disabled={busy} />
      </div>

      <Button
        className="w-full rounded-2xl"
        disabled={!canSubmit || busy}
        onClick={() =>
          onSubmit({
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim() || undefined,
            counselor_type: type,
            is_active: active,
          })
        }
      >
        {submitLabel}
      </Button>
    </div>
  );
}

export default function CounselorsPage() {
  const {
    items,
    loading,
    error,
    query,
    typeFilter,
    statusFilter,
    setQuery,
    setTypeFilter,
    setStatusFilter,
    create,
    update,
    toggleActive,
    remove,
    // lazy loader from provider (we'll call it when page mounts)
    ensureLoaded,
  } = useAdminCounselors();

  // ✅ Load as soon as this page mounts
  useEffect(() => {
    void ensureLoaded(); // guarded in provider; runs once per app lifetime
  }, [ensureLoaded]);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState<null | (typeof items)[number]>(null);
  const [openDelete, setOpenDelete] = useState<null | (typeof items)[number]>(
    null
  );

  const [detailsBusy, setDetailsBusy] = useState(false);
  const [availability, setAvailability] = useState<string[] | undefined>(
    undefined
  );
  const [specialities, setSpecialities] = useState<string[] | undefined>(
    undefined
  );
  const [createdAtFull, setCreatedAtFull] = useState<string | undefined>(
    undefined
  );
  const [detailsErr, setDetailsErr] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!openEdit) return;

    let cancelled = false;
    (async () => {
      try {
        setDetailsBusy(true);
        setDetailsErr(undefined);

        const root =
          (process.env.NEXT_PUBLIC_APP_BASE_URL &&
            process.env.NEXT_PUBLIC_APP_BASE_URL.replace(/\/$/, "")) ||
          "";
        const url = `${root}/admin-counselor/counselors/${openEdit.id}`;

        const headers: Record<string, string> = {};
        const t =
          typeof window !== "undefined"
            ? localStorage.getItem("auth_access_token")
            : null;
        if (t) headers["Authorization"] = `Bearer ${t}`;

        const res = await fetch(url, {
          method: "GET",
          headers,
          credentials: "include",
        });

        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(
            j?.error || `Failed to load counselor (${res.status})`
          );
        }

        const j = (await res.json()) as {
          counselor: {
            availability?: string[];
            specialities?: string[];
            created_at?: string;
          };
        };

        if (cancelled) return;

        setAvailability(j?.counselor?.availability ?? []);
        setSpecialities(j?.counselor?.specialities ?? []);
        setCreatedAtFull(j?.counselor?.created_at ?? openEdit.created_at);
      } catch (e: any) {
        if (!cancelled) setDetailsErr(e?.message || "Failed to load details");
      } finally {
        if (!cancelled) setDetailsBusy(false);
      }
    })();

    return () => {
      cancelled = true;
      setDetailsBusy(false);
      setDetailsErr(undefined);
      setAvailability(undefined);
      setSpecialities(undefined);
      setCreatedAtFull(undefined);
    };
  }, [openEdit]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((r) => {
      const matchesQuery =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.phone ?? "").toLowerCase().includes(q);

      const matchesType =
        typeFilter === "all" ? true : r.counselor_type === typeFilter;

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? r.is_active
          : !r.is_active;

      return matchesQuery && matchesType && matchesStatus;
    });
  }, [items, query, typeFilter, statusFilter]);

  async function handleCreate(data: FormPayload) {
    try {
      const created = await create(data);
      if (created) {
        toast.success("Counselor created");
        setOpenCreate(false);
      } else {
        toast.error("Failed to create counselor");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create counselor");
    }
  }

  async function handleUpdate(id: string, data: FormPayload) {
    try {
      const updated = await update(id, data);
      if (updated) {
        toast.success("Counselor updated");
        setOpenEdit(null);
      } else {
        toast.error("Failed to update counselor");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update counselor");
    }
  }

  async function handleDeleteConfirm(id: string) {
    try {
      const ok = await remove(id);
      if (ok) {
        toast.success("Counselor deleted");
        setOpenDelete(null);
      } else {
        toast.error("Failed to delete counselor");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete counselor");
    }
  }

  return (
    <>
      <DashboardLayout title="Admin Dashboard" sidebar={<AdminSidebar />}>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Counselors</h1>
              <p className="text-sm text-muted-foreground">
                Create and manage counselors
              </p>
            </div>

            <Button
              className="h-9 rounded-2xl shadow-sm"
              onClick={() => setOpenCreate(true)}
              disabled={loading}
            >
              <UserPlus2 className="mr-2 h-4 w-4" />
              New Counselor
            </Button>
          </div>

          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filters</CardTitle>
              <CardDescription>Search and refine the list</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div className="relative col-span-2">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email or phone"
                  className="pl-8"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={typeFilter}
                  onValueChange={(v) => setTypeFilter(v as any)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as any)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-base">All Counselors</CardTitle>
              <CardDescription>Manage availability and details</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[220px]">Counselor</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No counselors found.
                          {error ? (
                            <div className="mt-1 text-xs text-red-500">
                              {error}
                            </div>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((r: Counselor) => (
                        <TableRow key={r.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>
                                  {getInitials(r.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="font-medium truncate">
                                  {r.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {r.created_at
                                    ? `Created ${new Date(
                                        r.created_at
                                      ).toLocaleDateString()}`
                                    : "—"}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="truncate">{r.email}</TableCell>
                          <TableCell className="truncate">
                            {r.phone || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {r.counselor_type}
                            </Badge>
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
                                onCheckedChange={(v) => toggleActive(r.id, v)}
                                disabled={loading}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl"
                                onClick={() => setOpenEdit(r)}
                                disabled={loading}
                              >
                                <Pencil className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="rounded-xl"
                                onClick={() => setOpenDelete(r)}
                                disabled={loading}
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

              <div className="mt-4 text-xs text-muted-foreground">
                Showing {filteredItems.length} of {items.length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Modal
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          title="New Counselor"
          description="Add a counselor to your directory"
          footer={null}
        >
          <CounselorForm
            submitLabel="Create Counselor"
            onSubmit={handleCreate}
            busy={loading}
          />
        </Modal>

        <Modal
          open={!!openEdit}
          onClose={() => setOpenEdit(null)}
          title="Edit Counselor"
          description={openEdit?.name}
          footer={null}
        >
          {openEdit && (
            <div className="grid gap-6">
              <CounselorForm
                initial={{
                  name: openEdit.name,
                  email: openEdit.email,
                  phone: openEdit.phone,
                  counselor_type: openEdit.counselor_type,
                  is_active: openEdit.is_active,
                }}
                submitLabel="Save Changes"
                onSubmit={(data) => handleUpdate(openEdit.id, data)}
                busy={loading}
              />

              <div className="rounded-xl border p-4">
                <div className="grid gap-3">
                  <div className="grid gap-1">
                    <span className="text-xs text-muted-foreground">
                      Created At
                    </span>
                    <span className="text-sm">
                      {formatDateTime(createdAtFull ?? openEdit.created_at)}
                    </span>
                  </div>

                  <div className="grid gap-1">
                    <span className="text-xs text-muted-foreground">
                      Availability
                    </span>
                    {detailsBusy ? (
                      <span className="text-sm">Loading…</span>
                    ) : detailsErr ? (
                      <span className="text-sm text-red-500">{detailsErr}</span>
                    ) : (availability?.length ?? 0) > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {availability!.map((a, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="rounded-lg"
                          >
                            {a}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm">—</span>
                    )}
                  </div>

                  <div className="grid gap-1">
                    <span className="text-xs text-muted-foreground">
                      Specialities
                    </span>
                    {detailsBusy ? (
                      <span className="text-sm">Loading…</span>
                    ) : detailsErr ? (
                      <span className="text-sm text-red-500">{detailsErr}</span>
                    ) : (specialities?.length ?? 0) > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {specialities!.map((s, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="rounded-lg"
                          >
                            {s}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm">—</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>

        <Modal
          open={!!openDelete}
          onClose={() => setOpenDelete(null)}
          title="Delete Counselor"
          description="This action cannot be undone."
          footer={
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setOpenDelete(null)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl"
                onClick={() => openDelete && handleDeleteConfirm(openDelete.id)}
                disabled={loading}
              >
                Delete
              </Button>
            </div>
          }
        >
          <div className="text-sm">
            Are you sure you want to delete{" "}
            <span className="font-medium">{openDelete?.name}</span>? This will
            remove their access and hide them from student booking.
          </div>
        </Modal>
      </DashboardLayout>

      <Toaster richColors closeButton position="top-right" />
    </>
  );
}
