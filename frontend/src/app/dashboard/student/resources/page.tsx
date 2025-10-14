"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Video,
  FileText,
  Search,
  Play,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Download,
  Link as LinkIcon,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StudentSidebar } from "@/components/studentSidebar/StudentSidebar";
import {
  StudentResourcesProvider,
  useStudentResources,
} from "@/Context/StudentResourcesProvider";
import { Modal } from "@/components/Modal/modal";

/* ---------- Types matching your provider ---------- */
type ResourceType = "video" | "article" | "pdf" | "other" | undefined;
type Resource = {
  id: string;
  title: string;
  description?: string | null;
  type?: ResourceType;
  file_url?: string | null;
  created_at: string;
};

/* ---------- Small helpers ---------- */
function getIconByType(type?: ResourceType) {
  switch (type) {
    case "video":
      return <Video className="h-5 w-5 text-red-600" />;
    case "pdf":
      return <FileText className="h-5 w-5 text-green-600" />;
    case "article":
    default:
      return <BookOpen className="h-5 w-5 text-blue-600" />;
  }
}
function typeBadgeClass(type?: ResourceType) {
  switch (type) {
    case "video":
      return "bg-red-100 text-red-800";
    case "pdf":
      return "bg-green-100 text-green-800";
    case "article":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/* ---------- Page Body (uses provider) ---------- */
function PageBody() {
  const {
    items,
    total,
    page,
    pages,
    loading,
    error,
    query,
    typeFilter,
    setQuery,
    setTypeFilter,
    ensureLoaded,
    refetch,
  } = useStudentResources();

  // Load once on mount
  useEffect(() => {
    void ensureLoaded();
  }, [ensureLoaded]);

  // Local controlled input (avoid refetch on each keypress)
  const [qInput, setQInput] = useState(query);

  // Modal state
  const [openRes, setOpenRes] = useState<Resource | null>(null);

  const handleSearch = async () => {
    setQuery(qInput);
    await refetch({ page: 1 });
  };

  const handleTypeChange = async (
    v: "all" | "video" | "article" | "pdf" | "other"
  ) => {
    setTypeFilter(v);
    await refetch({ page: 1 });
  };

  const go = async (p: number) => {
    await refetch({ page: p });
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Self-Help Resources
          </h1>
          <p className="text-gray-600 mt-1">
            Discover curated content to support your mental health journey.
          </p>
        </div>

        {/* Search & Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search resources..."
                    value={qInput}
                    onChange={(e) => setQInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearch();
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select
                value={typeFilter}
                onValueChange={(v) =>
                  handleTypeChange(
                    v as "all" | "video" | "article" | "pdf" | "other"
                  )
                }
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="article">Articles</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="pdf">PDFs</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleSearch} disabled={loading}>
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </CardContent>
        </Card>

        {/* Featured (first 3 newest from current list) */}
        <Card>
          <CardHeader>
            <CardTitle>Featured This Week</CardTitle>
            <CardDescription>Newest uploads</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && items.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <div className="h-4 w-28 bg-muted animate-pulse mb-3 rounded" />
                    <div className="h-4 w-48 bg-muted animate-pulse mb-2 rounded" />
                    <div className="h-4 w-36 bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No resources yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.slice(0, 3).map((r) => (
                  <div
                    key={r.id}
                    className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-green-50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      {getIconByType(r.type)}
                      <Badge className={typeBadgeClass(r.type)}>{r.type}</Badge>
                    </div>
                    <h3 className="font-medium mb-2">{r.title}</h3>
                    {r.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                        {r.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        <Clock className="h-4 w-4 inline-block mr-1 text-gray-400" />
                        {new Date(r.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2">
                        {r.file_url && (
                          <Button size="sm" asChild>
                            <a
                              href={r.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {r.type === "video" ? (
                                <Play className="mr-1 h-3 w-3" />
                              ) : (
                                <ExternalLink className="mr-1 h-3 w-3" />
                              )}
                              Open
                            </a>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setOpenRes(r)}
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              All Resources
              <span className="text-sm font-normal text-gray-500">
                {total} total
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && items.length === 0 ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 p-4 border rounded-lg"
                  >
                    <div className="h-5 w-5 bg-muted animate-pulse rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-56 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-72 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No resources found</p>
                <p className="text-sm text-gray-500 mt-1">
                  Try adjusting your search or type filter
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getIconByType(r.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {r.title}
                          </h3>
                          {r.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {r.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-3">
                            <Badge
                              className={`text-xs ${typeBadgeClass(r.type)}`}
                            >
                              {r.type}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="h-4 w-4" />
                              <span>
                                {new Date(r.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          {r.file_url ? (
                            <Button size="sm" asChild>
                              <a
                                href={r.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="mr-1 h-3 w-3" />
                                Open
                              </a>
                            </Button>
                          ) : (
                            <Button size="sm" disabled>
                              <ExternalLink className="mr-1 h-3 w-3" />
                              Unavailable
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOpenRes(r)}
                          >
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page <= 1 || loading}
                    onClick={() => go(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground min-w-[64px] text-center">
                    {page} / {Math.max(1, pages)}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page >= pages || loading}
                    onClick={() => go(page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Details Modal */}
      <Modal
        open={!!openRes}
        onClose={() => setOpenRes(null)}
        title="Resource Details"
        description={openRes?.title}
        footer={
          <div className="flex gap-2">
            {openRes?.file_url && (
              <>
                <Button asChild className="flex-1 rounded-xl">
                  <a
                    href={openRes.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => {
                    // best-effort download via anchor; file must be served with correct headers
                    const a = document.createElement("a");
                    a.href = openRes.file_url!;
                    a.download = openRes.title.replace(/\s+/g, "_");
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                  }}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </>
            )}
            {!openRes?.file_url && (
              <Button disabled className="flex-1 rounded-xl">
                <LinkIcon className="h-4 w-4 mr-1" />
                No File
              </Button>
            )}
          </div>
        }
      >
        {openRes && (
          <div className="grid gap-3 text-sm">
            <div className="flex items-center justify-between">
              <Badge className={typeBadgeClass(openRes.type)}>
                {openRes.type || "other"}
              </Badge>
              <div className="text-xs text-muted-foreground">
                <Clock className="inline h-3 w-3 mr-1" />
                {new Date(openRes.created_at).toLocaleString()}
              </div>
            </div>

            {openRes.description && (
              <div className="grid gap-1">
                <span className="text-muted-foreground">Description</span>
                <p className="text-sm">{openRes.description}</p>
              </div>
            )}

            {openRes.file_url && (
              <div className="grid gap-1">
                <span className="text-muted-foreground">File</span>
                <a
                  href={openRes.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {openRes.file_url}
                </a>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

export default function ResourcesPage() {
  return (
    <DashboardLayout title="Student Dashboard" sidebar={<StudentSidebar />}>
      <StudentResourcesProvider>
        <PageBody />
      </StudentResourcesProvider>
    </DashboardLayout>
  );
}
