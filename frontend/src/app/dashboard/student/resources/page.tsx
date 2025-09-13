"use client";

import { useState } from "react";
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
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StudentSidebar } from "@/components/studentSidebar/StudentSidebar";

const categories = [
  "All",
  "Stress Management",
  "Mindfulness",
  "Academic Success",
  "Anxiety",
  "Depression",
  "Relationships",
];

const mockResources = [
  {
    id: 1,
    title: "Managing Stress During Exams",
    description:
      "Tips and techniques to manage exam-related stress effectively.",
    category: "Stress Management",
    type: "article",
    duration: "5 min read",
    link: "#",
  },
  {
    id: 2,
    title: "Mindfulness Meditation for Beginners",
    description:
      "A guided video session to help you start practicing mindfulness.",
    category: "Mindfulness",
    type: "video",
    duration: "12 min",
    link: "#",
  },
  {
    id: 3,
    title: "Overcoming Academic Burnout",
    description: "Learn strategies to prevent and recover from burnout.",
    category: "Academic Success",
    type: "pdf",
    duration: "8 pages",
    link: "#",
  },
  {
    id: 4,
    title: "Coping with Anxiety",
    description: "Practical exercises to handle anxiety in everyday life.",
    category: "Anxiety",
    type: "article",
    duration: "7 min read",
    link: "#",
  },
  {
    id: 5,
    title: "Daily Mindfulness Routine",
    description: "Simple daily practices to stay grounded and mindful.",
    category: "Mindfulness",
    type: "video",
    duration: "10 min",
    link: "#",
  },
  {
    id: 6,
    title: "Understanding Depression",
    description:
      "An educational resource to understand the symptoms and coping strategies for depression.",
    category: "Depression",
    type: "pdf",
    duration: "15 pages",
    link: "#",
  },
  {
    id: 7,
    title: "Healthy Relationship Tips",
    description:
      "Guidelines for building and maintaining healthy relationships.",
    category: "Relationships",
    type: "article",
    duration: "6 min read",
    link: "#",
  },
  {
    id: 8,
    title: "Deep Breathing for Stress Relief",
    description:
      "Follow this guided video to calm your mind using deep breathing.",
    category: "Stress Management",
    type: "video",
    duration: "5 min",
    link: "#",
  },
  {
    id: 9,
    title: "Study Techniques for Better Focus",
    description:
      "Improve your concentration and learning with these study tips.",
    category: "Academic Success",
    type: "article",
    duration: "9 min read",
    link: "#",
  },
];

export default function ResourcesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState("all");

  const filteredResources = mockResources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || resource.category === selectedCategory;
    const matchesType =
      selectedType === "all" || resource.type === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-5 w-5 text-red-600" />;
      case "article":
        return <BookOpen className="h-5 w-5 text-blue-600" />;
      case "pdf":
        return <FileText className="h-5 w-5 text-green-600" />;
      default:
        return <BookOpen className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "video":
        return "bg-red-100 text-red-800";
      case "article":
        return "bg-blue-100 text-blue-800";
      case "pdf":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardLayout title="Student Dashboard" sidebar={<StudentSidebar />}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Self-Help Resources
          </h1>
          <p className="text-gray-600 mt-1">
            Discover curated content to support your mental health journey.
          </p>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search resources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="article">Articles</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="pdf">PDFs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Featured Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Featured This Week</CardTitle>
            <CardDescription>
              Handpicked resources based on current trends and student feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockResources.slice(0, 3).map((resource) => (
                <div
                  key={resource.id}
                  className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-green-50"
                >
                  <div className="flex items-start justify-between mb-3">
                    {getResourceIcon(resource.type)}
                    <Badge className={getTypeColor(resource.type)}>
                      {resource.type}
                    </Badge>
                  </div>
                  <h3 className="font-medium mb-2">{resource.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {resource.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {resource.duration}
                      </span>
                    </div>
                    <Button size="sm">
                      {resource.type === "video" ? (
                        <Play className="mr-1 h-3 w-3" />
                      ) : (
                        <ExternalLink className="mr-1 h-3 w-3" />
                      )}
                      {resource.type === "video" ? "Watch" : "Read"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* All Resources */}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              All Resources
              <span className="text-sm font-normal text-gray-500">
                {filteredResources.length} resources found
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredResources.length > 0 ? (
              <div className="space-y-4">
                {filteredResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-start space-x-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getResourceIcon(resource.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {resource.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {resource.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-3">
                            <Badge variant="outline" className="text-xs">
                              {resource.category}
                            </Badge>
                            <Badge
                              className={`text-xs ${getTypeColor(
                                resource.type
                              )}`}
                            >
                              {resource.type}
                            </Badge>
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Clock className="h-4 w-4" />
                              <span>{resource.duration}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2 ml-4">
                          <Button size="sm">
                            {resource.type === "video" ? (
                              <>
                                <Play className="mr-1 h-3 w-3" />
                                Watch
                              </>
                            ) : (
                              <>
                                <ExternalLink className="mr-1 h-3 w-3" />
                                {resource.type === "pdf" ? "Download" : "Read"}
                              </>
                            )}
                          </Button>
                          <Button variant="outline" size="sm">
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No resources found</p>
                <p className="text-sm text-gray-500 mt-1">
                  Try adjusting your search terms or filters
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
