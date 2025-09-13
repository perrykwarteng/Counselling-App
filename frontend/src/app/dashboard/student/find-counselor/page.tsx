"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Brain, Sparkles, Star, Calendar, Users } from "lucide-react";
import { StudentSidebar } from "@/components/studentSidebar/StudentSidebar";

export default function FindCounselorPage() {
  const router = useRouter();
  const [step, setStep] = useState<"assessment" | "matches">("assessment");
  const [openBooking, setOpenBooking] = useState(false);
  const [selectedCounselor, setSelectedCounselor] = useState<any>(null);

  const [assessmentData, setAssessmentData] = useState({
    currentIssues: "",
    counselorType: "",
    sessionType: "",
    topics: [] as string[],
  });

  const availableTopics = [
    "anxiety",
    "depression",
    "academic stress",
    "relationships",
    "career",
  ];

  const handleTopicToggle = (topic: string) => {
    setAssessmentData((prev) => ({
      ...prev,
      topics: prev.topics.includes(topic)
        ? prev.topics.filter((t) => t !== topic)
        : [...prev.topics, topic],
    }));
  };

  // Fake counselors
  const mockCounselors = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      type: "Professional Therapist",
      rating: 4.9,
      sessions: 120,
      avatar: "/avatars/1.png",
      bio: "Specializes in anxiety, depression, and stress management.",
      availability: "Mon-Fri, 9am-5pm",
    },
    {
      id: 2,
      name: "Mr. James Doe",
      type: "Academic Counselor",
      rating: 4.7,
      sessions: 80,
      avatar: "/avatars/2.png",
      bio: "Focuses on academic stress, study techniques, and career advice.",
      availability: "Tue-Thu, 10am-6pm",
    },
  ];

  const renderAssessment = () => (
    <Card className="max-w-3xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
          <Brain className="h-6 w-6 text-blue-600" />
          Quick Assessment
        </CardTitle>
        <CardDescription>
          Answer a few questions to match with the right counselor
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-base font-medium">
            What brings you here? *
          </Label>
          <Textarea
            value={assessmentData.currentIssues}
            onChange={(e) =>
              setAssessmentData((prev) => ({
                ...prev,
                currentIssues: e.target.value,
              }))
            }
            placeholder="E.g. I feel anxious during exams..."
            className="mt-2 min-h-[100px]"
          />
        </div>

        <div className="md:w-8/12 flex flex-col md:flex-row items-center justify-between">
          <div>
            <Label>Counselor Type Preference</Label>
            <Select
              value={assessmentData.counselorType}
              onValueChange={(value) =>
                setAssessmentData((p) => ({ ...p, counselorType: value }))
              }
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="academic">Academic Counselor</SelectItem>
                <SelectItem value="professional">
                  Professional Therapist
                </SelectItem>
                <SelectItem value="either">Either</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Session Format</Label>
            <Select
              value={assessmentData.sessionType}
              onValueChange={(value) =>
                setAssessmentData((p) => ({ ...p, sessionType: value }))
              }
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Video Call</SelectItem>
                <SelectItem value="chat">Text Chat</SelectItem>
                <SelectItem value="either">Either</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Topics you want to discuss</Label>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {availableTopics.map((topic) => (
              <div key={topic} className="flex items-center gap-2">
                <Checkbox
                  checked={assessmentData.topics.includes(topic)}
                  onCheckedChange={() => handleTopicToggle(topic)}
                />
                <span className="text-sm capitalize">{topic}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            className="px-6 py-2"
            onClick={() => setStep("matches")}
            disabled={
              !assessmentData.currentIssues || !assessmentData.counselorType
            }
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Find My Counselor
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderMatches = () => (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Your Matches</CardTitle>
          <CardDescription>
            Choose a counselor and book a session
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {mockCounselors.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={c.avatar} />
                  <AvatarFallback>{c.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{c.name}</h3>
                  <Badge variant="outline">{c.type}</Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{c.bio}</p>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  {c.rating} ({c.sessions} sessions)
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedCounselor(c);
                    setOpenBooking(true);
                  }}
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Book
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center">
        <Button variant="outline" onClick={() => setStep("assessment")}>
          Retake Assessment
        </Button>
      </div>

      {/* Booking Modal */}
      <Dialog open={openBooking} onOpenChange={setOpenBooking}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book with {selectedCounselor?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Availability: {selectedCounselor?.availability}
            </p>
            <Button
              className="w-full"
              onClick={() => router.push("/student/appointments")}
            >
              Confirm Appointment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <DashboardLayout title="Find Counselor" sidebar={<StudentSidebar />}>
      {step === "assessment" && renderAssessment()}
      {step === "matches" && renderMatches()}
    </DashboardLayout>
  );
}
