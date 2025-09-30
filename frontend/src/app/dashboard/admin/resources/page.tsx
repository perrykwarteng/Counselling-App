"use client";

import { useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* Icons */
import { Search, Pencil, Trash2, ExternalLink, Plus } from "lucide-react";

/* Provider hook & types */
import {
  AdminResourcesProvider,
  useAdminResources,
  type Resource,
  type CreateResourceInput,
} from "../../../../Context/AdminResourcesProvider";

/* ------------------ FORM ------------------ */
function ResourceForm({
  initial,
  onSubmit,
  submitLabel = "Save",
}: {
  initial: Partial<Resource>;
  onSubmit: (data: Omit<Resource, "id" | "created_at" | "updated_at">) => void;
  submitLabel?: string;
}) {
  const [title, setTitle] = useState(initial.title ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [type, setType] = useState<Resource["type"]>(initial.type ?? "article");
  const [file, setFile] = useState<File | null>(null);

  const canSubmit = title.trim().length > 0;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="grid gap-2">
        <Label>Description</Label>
        <Input
          value={description ?? ""}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label>Type</Label>
        <Select
          value={type ?? "other"}
          onValueChange={(v) => setType(v as Resource["type"])}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="article">Article</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="file">Upload File</Label>
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed cursor-pointer text-center transition-colors",
            file
              ? "border-primary/50 bg-primary/5"
              : "border-muted-foreground/30 hover:border-primary/50"
          )}
          onClick={() => document.getElementById("fileInput")?.click()}
        >
          {file ? (
            <>
              <span className="text-sm font-medium">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                Click to change file
              </span>
            </>
          ) : (
            <>
              <span className="text-sm font-medium">
                Drag & drop or click to upload
              </span>
              <span className="text-xs text-muted-foreground">
                Supported: PDF, MP4, DOCX, etc.
              </span>
            </>
          )}
        </div>
        <input
          id="fileInput"
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <Button
        className="w-full rounded-2xl"
        disabled={!canSubmit}
        onClick={() =>
          onSubmit({
            title: title.trim(),
            description: description.trim() || null,
            type,
            // NOTE: if you're using the upload endpoint, you should:
            // 1) POST file to /admin-resources/upload (FormData)
            // 2) get back {file_url} and pass it here.
            file_url: file ? file.name : initial.file_url ?? null,
          })
        }
      >
        {submitLabel}
      </Button>
    </div>
  );
}

/* ------------------ MAIN ------------------ */
function AdminResourcesInner() {
  const { items, query, setQuery, create, update, remove } =
    useAdminResources();

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState<Resource | null>(null);
  const [openDelete, setOpenDelete] = useState<Resource | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q)
    );
  }, [items, query]);

  async function handleCreate(
    payload: Omit<Resource, "id" | "created_at" | "updated_at">
  ) {
    const res = await create(payload as CreateResourceInput);
    if (res) setOpenCreate(false);
  }

  async function handleUpdate(
    id: string,
    payload: Omit<Resource, "id" | "created_at" | "updated_at">
  ) {
    await update(id, payload);
    setOpenEdit(null);
  }

  async function handleDeleteConfirm(id: string) {
    const ok = await remove(id);
    if (ok) setOpenDelete(null);
  }

  return (
    <DashboardLayout title="Resources" sidebar={<AdminSidebar />}>
      {/* Filters */}
      <Card className="mb-6 rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Resources</CardTitle>
          <Button
            onClick={() => setOpenCreate(true)}
            size="sm"
            className="rounded-xl"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Resource
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search resources..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="rounded-xl"
            />
            <Button variant="outline" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resource Cards */}
      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            No resources found
          </p>
        ) : (
          filtered.map((r) => (
            <Card key={r.id} className="rounded-2xl hover:shadow-md transition">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">{r.title}</CardTitle>
                  {r.description && (
                    <CardDescription>{r.description}</CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={cn(
                      r.type === "article" && "bg-blue-100 text-blue-700",
                      r.type === "video" && "bg-purple-100 text-purple-700",
                      r.type === "pdf" && "bg-red-100 text-red-700",
                      (!r.type || r.type === "other") &&
                        "bg-gray-100 text-gray-700"
                    )}
                  >
                    {r.type ?? "Other"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex justify-end gap-2">
                {r.file_url && (
                  <Button variant="ghost" size="icon" asChild>
                    <a
                      href={r.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpenEdit(r)}
                >
                  <Pencil className="h-4 w-4 text-muted-foreground hover:text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpenDelete(r)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-600" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modals */}
      <Modal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        title="Add Resource"
      >
        <ResourceForm
          initial={{}}
          onSubmit={handleCreate}
          submitLabel="Create"
        />
      </Modal>

      {/* Edit */}
      <Modal
        open={!!openEdit}
        onClose={() => setOpenEdit(null)}
        title="Edit Resource"
      >
        {openEdit && (
          <ResourceForm
            initial={openEdit}
            onSubmit={(data) => handleUpdate(openEdit.id, data)}
            submitLabel="Update"
          />
        )}
      </Modal>

      {/* Delete */}
      <Modal
        open={!!openDelete}
        onClose={() => setOpenDelete(null)}
        title="Delete Resource"
      >
        {openDelete && (
          <div className="space-y-4">
            <p>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{openDelete.title}</span>?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteConfirm(openDelete.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}

export default function AdminResourcesPage() {
  return <AdminResourcesInner />;
}
