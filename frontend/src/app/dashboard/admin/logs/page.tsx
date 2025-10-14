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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Eye,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Copy,
  RefreshCw,
} from "lucide-react";

import { useAdminLogs } from "@/Context/AdminLogsProvider";

/* ------------------ TYPES ------------------ */
type LogLevel = "info" | "warn" | "error" | "audit";
type LogRow = {
  id: string;
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  user_id?: string | null;
  request_id?: string | null;
  meta?: Record<string, any>;
};

/* ------------------ HELPERS ------------------ */
function fmtDate(ts: string) {
  try {
    const d = new Date(ts);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  } catch {
    return ts;
  }
}
function download(filename: string, text: string, type = "text/plain") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function toCSV(rows: LogRow[]) {
  const headers = [
    "id",
    "timestamp",
    "level",
    "module",
    "message",
    "user_id",
    "request_id",
    "meta_json",
  ];
  const escape = (v: any) => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes("\n") || s.includes('"')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.id,
        r.timestamp,
        r.level,
        r.module,
        r.message,
        r.user_id ?? "",
        r.request_id ?? "",
        JSON.stringify(r.meta ?? {}),
      ]
        .map(escape)
        .join(",")
    ),
  ];
  return lines.join("\n");
}

/* ------------------ PAGE ------------------ */
export default function AdminSystemLogsPage() {
  const { loading, items, refetch, ensureLoaded } = useAdminLogs();

  // ✅ Auto-load when page mounts (one-time guarded in provider)
  useEffect(() => {
    void ensureLoaded();
  }, [ensureLoaded]);

  // Filters
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<"all" | LogLevel>("all");
  const [moduleFilter, setModuleFilter] = useState<"all" | string>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<5 | 10 | 20>(10);

  // Modal
  const [openView, setOpenView] = useState<null | LogRow>(null);

  const rows = items as LogRow[];

  // Module list
  const modules = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => s.add(r.module));
    return Array.from(s).sort();
  }, [rows]);

  // Filter + sort
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const fromTs = from ? new Date(from).getTime() : null;
    const toTs = to ? new Date(to).getTime() : null;

    return rows
      .filter((r) => {
        if (levelFilter !== "all" && r.level !== levelFilter) return false;
        if (moduleFilter !== "all" && r.module !== moduleFilter) return false;

        const ts = new Date(r.timestamp).getTime();
        if (fromTs && ts < fromTs) return false;
        if (toTs && ts > toTs) return false;

        if (!q) return true;

        const hay = `${r.message} ${r.module} ${r.user_id ?? ""} ${
          r.request_id ?? ""
        } ${JSON.stringify(r.meta ?? {})}`.toLowerCase();

        return hay.includes(q);
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }, [rows, query, levelFilter, moduleFilter, from, to]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, total);
  const pageRows = filtered.slice(start, end);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Export
  const handleExportCSV = () => {
    download(
      `system-logs_${new Date().toISOString()}.csv`,
      toCSV(filtered),
      "text/csv"
    );
  };
  const handleExportJSON = () => {
    download(
      `system-logs_${new Date().toISOString()}.json`,
      JSON.stringify(filtered, null, 2),
      "application/json"
    );
  };
  const handleCopyJSON = async (row: LogRow) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(row, null, 2));
    } catch {}
  };

  const handleResetFilters = async () => {
    setQuery("");
    setLevelFilter("all");
    setModuleFilter("all");
    setFrom("");
    setTo("");
    setPage(1);
    await refetch();
  };

  return (
    <DashboardLayout title="System Logs" sidebar={<AdminSidebar />}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">System Logs</h1>
            <p className="text-sm text-muted-foreground">
              Inspect application events, errors, and audit trails.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={handleResetFilters}
            >
              <RefreshCw
                className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`}
              />{" "}
              Reset
            </Button>
            <Button className="rounded-xl" onClick={handleExportCSV}>
              <FileDown className="h-4 w-4 mr-1" /> Export CSV
            </Button>
            <Button
              className="rounded-xl"
              variant="secondary"
              onClick={handleExportJSON}
            >
              <FileDown className="h-4 w-4 mr-1" /> Export JSON
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filters</CardTitle>
            <CardDescription>Search and refine the log stream</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search message, module, user, request id, meta…"
                className="pl-8"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                disabled={loading}
              />
            </div>

            {/* Level */}
            <Select
              value={levelFilter}
              onValueChange={(v) => {
                setLevelFilter(v as any);
                setPage(1);
              }}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warn">Warn</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="audit">Audit</SelectItem>
              </SelectContent>
            </Select>

            {/* Module */}
            <Select
              value={moduleFilter}
              onValueChange={(v) => {
                setModuleFilter(v as any);
                setPage(1);
              }}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All modules</SelectItem>
                {modules.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date range */}
            <div className="grid gap-2 md:col-span-2 md:grid-cols-2">
              <div className="grid gap-1">
                <Label htmlFor="from">From</Label>
                <Input
                  id="from"
                  type="datetime-local"
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    setPage(1);
                  }}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="to">To</Label>
                <Input
                  id="to"
                  type="datetime-local"
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                    setPage(1);
                  }}
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-base">Log Stream</CardTitle>
            <CardDescription>Newest first</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Time</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead className="min-w-[320px]">Message</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Request</TableHead>
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
                        No logs match your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageRows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap">
                          {fmtDate(r.timestamp)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "capitalize",
                              r.level === "info" &&
                                "border-blue-500 text-blue-700",
                              r.level === "warn" &&
                                "border-amber-500 text-amber-700",
                              r.level === "error" &&
                                "border-red-500 text-red-700",
                              r.level === "audit" &&
                                "border-green-500 text-green-700"
                            )}
                          >
                            {r.level}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{r.module}</TableCell>
                        <TableCell className="truncate max-w-[420px]">
                          {r.message}
                        </TableCell>
                        <TableCell className="truncate max-w-[140px]">
                          {r.user_id || "—"}
                        </TableCell>
                        <TableCell className="truncate max-w-[160px]">
                          {r.request_id || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl"
                              onClick={() => setOpenView(r)}
                              disabled={loading}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl"
                              onClick={() => handleCopyJSON(r)}
                              disabled={loading}
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Copy JSON
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
                    disabled={loading}
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
                    disabled={loading || page === 1}
                    aria-label="Previous page"
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
                    disabled={loading || page === totalPages}
                    aria-label="Next page"
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
        title="Log Entry"
        description={openView?.id}
        footer={
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() =>
                openView &&
                navigator.clipboard.writeText(JSON.stringify(openView, null, 2))
              }
              disabled={loading}
            >
              <Copy className="h-4 w-4 mr-1" /> Copy JSON
            </Button>
            <Button
              className="flex-1 rounded-xl"
              onClick={() => {
                if (openView) {
                  download(
                    `log_${openView.id}.json`,
                    JSON.stringify(openView, null, 2),
                    "application/json"
                  );
                }
              }}
              disabled={loading}
            >
              <FileDown className="h-4 w-4 mr-1" /> Download
            </Button>
          </div>
        }
      >
        {openView && (
          <div className="grid gap-3 text-sm">
            <div className="grid gap-1">
              <span className="text-muted-foreground">Time</span>
              <span>{fmtDate(openView.timestamp)}</span>
            </div>
            <div className="grid gap-1">
              <span className="text-muted-foreground">Level</span>
              <span className="capitalize">{openView.level}</span>
            </div>
            <div className="grid gap-1">
              <span className="text-muted-foreground">Module</span>
              <span className="capitalize">{openView.module}</span>
            </div>
            <div className="grid gap-1">
              <span className="text-muted-foreground">Message</span>
              <span>{openView.message}</span>
            </div>
            <div className="grid gap-1">
              <span className="text-muted-foreground">User</span>
              <span>{openView.user_id || "—"}</span>
            </div>
            <div className="grid gap-1">
              <span className="text-muted-foreground">Request</span>
              <span>{openView.request_id || "—"}</span>
            </div>
            {openView.meta && (
              <div className="grid gap-1">
                <span className="text-muted-foreground">Meta</span>
                <pre className="bg-muted/50 p-2 rounded-lg overflow-x-auto text-xs">
                  {JSON.stringify(openView.meta, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
