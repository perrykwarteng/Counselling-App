"use client";

import { useState, useEffect } from "react";
// import { useAuth } from '@/contexts/AuthContext';
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Heart,
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  Plus,
  BarChart3,
  AlertTriangle,
  Smile,
  Meh,
  Frown,
} from "lucide-react";
import { StudentSidebar } from "@/components/studentSidebar/StudentSidebar";
// import { mockMoodEntries } from '@/lib/mock-data';
// import { MoodEntry } from '@/types';

export default function MoodTrackerPage() {
  // const { user, loading } = useAuth();
  const router = useRouter();
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  // const [moodEntries, setMoodEntries] = useState<MoodEntry[]>(mockMoodEntries);

  const [newEntry, setNewEntry] = useState({
    mood: [7],
    emotions: [] as string[],
    notes: "",
    triggers: [] as string[],
  });

  // useEffect(() => {
  //   if (!loading && (!user || user.role !== 'student')) {
  //     router.push('/');
  //   }
  // }, [user, loading, router]);

  // if (loading || !user) {
  //   return <div>Loading...</div>;
  // }

  // const userMoods = moodEntries.filter(entry => entry.studentId === user.id);
  // const recentMoods = userMoods.slice(0, 7);
  // const averageMood = userMoods.length > 0 ?
  //   userMoods.reduce((sum, entry) => sum + entry.mood, 0) / userMoods.length : 0;

  // const moodTrend = recentMoods.length > 1 ?
  //   recentMoods[0].mood - recentMoods[1].mood : 0;

  const emotionOptions = [
    "happy",
    "sad",
    "anxious",
    "calm",
    "angry",
    "excited",
    "overwhelmed",
    "hopeful",
    "frustrated",
    "content",
    "worried",
    "grateful",
    "lonely",
    "confident",
    "stressed",
  ];

  const triggerOptions = [
    "work/studies",
    "relationships",
    "family",
    "health",
    "finances",
    "social situations",
    "weather",
    "sleep",
    "exercise",
    "news",
    "deadlines",
    "conflict",
    "loneliness",
    "change",
    "uncertainty",
  ];

  const handleEmotionToggle = (emotion: string) => {
    setNewEntry((prev) => ({
      ...prev,
      emotions: prev.emotions.includes(emotion)
        ? prev.emotions.filter((e) => e !== emotion)
        : [...prev.emotions, emotion],
    }));
  };

  const handleTriggerToggle = (trigger: string) => {
    setNewEntry((prev) => ({
      ...prev,
      triggers: prev.triggers.includes(trigger)
        ? prev.triggers.filter((t) => t !== trigger)
        : [...prev.triggers, trigger],
    }));
  };

  const handleSaveEntry = () => {
    // const moodEntry: MoodEntry = {
    //   id: Math.random().toString(36).substr(2, 9),
    //   studentId: user.id,
    //   date: selectedDate || new Date(),
    //   mood: newEntry.mood[0],
    //   emotions: newEntry.emotions,
    //   notes: newEntry.notes,
    //   triggers: newEntry.triggers,
    //   isEmergency: newEntry.mood[0] <= 3 || newEntry.notes.toLowerCase().includes('harm'),
    //   flaggedKeywords: newEntry.mood[0] <= 3 ? ['low mood'] : undefined
    // };

    // setMoodEntries(prev => [moodEntry, ...prev]);
    setNewEntry({ mood: [7], emotions: [], notes: "", triggers: [] });
    setShowAddEntry(false);
  };

  const getMoodIcon = (mood: number) => {
    if (mood >= 7) return <Smile className="h-5 w-5 text-green-500" />;
    if (mood >= 4) return <Meh className="h-5 w-5 text-yellow-500" />;
    return <Frown className="h-5 w-5 text-red-500" />;
  };

  const getMoodColor = (mood: number) => {
    if (mood >= 7) return "bg-green-500";
    if (mood >= 4) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <DashboardLayout title="Mood Tracker" sidebar={<StudentSidebar />}>
      <div className="space-y-6">
        {/* Header with Add Entry Button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Mood Tracker</h2>
            <p className="text-muted-foreground">
              Track your emotional well-being and identify patterns
            </p>
          </div>
          <Button onClick={() => setShowAddEntry(!showAddEntry)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Mood
              </CardTitle>
              <Heart className="h-4 w-4 text-pink-600" />
            </CardHeader>
            <CardContent>
              {/* <div className="text-2xl font-bold">{averageMood.toFixed(1)}/10</div> */}
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mood Trend</CardTitle>
              {/* {moodTrend >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )} */}
            </CardHeader>
            <CardContent>
              {/* <div className={`text-2xl font-bold ${moodTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {moodTrend >= 0 ? '+' : ''}{moodTrend.toFixed(1)}
              </div> */}
              <p className="text-xs text-muted-foreground">From yesterday</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Entries This Week
              </CardTitle>
              <CalendarIcon className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {/* <div className="text-2xl font-bold">{recentMoods.length}</div> */}
              <p className="text-xs text-muted-foreground">Target: 7 entries</p>
            </CardContent>
          </Card>
        </div>

        {/* Add Entry Form */}
        {showAddEntry && (
          <Card>
            <CardHeader>
              <CardTitle>Add Mood Entry</CardTitle>
              <CardDescription>
                How are you feeling today? Be honest with yourself.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-medium mb-4 block">
                      How is your mood today? ({newEntry.mood[0]}/10)
                    </Label>
                    <div className="px-4">
                      <Slider
                        value={newEntry.mood}
                        onValueChange={(value) =>
                          setNewEntry((prev) => ({ ...prev, mood: value }))
                        }
                        max={10}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>Very Poor</span>
                        <span>Neutral</span>
                        <span>Excellent</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium">
                      What emotions are you experiencing?
                    </Label>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {emotionOptions.map((emotion) => (
                        <div
                          key={emotion}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={emotion}
                            checked={newEntry.emotions.includes(emotion)}
                            onCheckedChange={() => handleEmotionToggle(emotion)}
                          />
                          <Label
                            htmlFor={emotion}
                            className="text-sm capitalize"
                          >
                            {emotion}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium">
                      What might have influenced your mood?
                    </Label>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {triggerOptions.map((trigger) => (
                        <div
                          key={trigger}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={trigger}
                            checked={newEntry.triggers.includes(trigger)}
                            onCheckedChange={() => handleTriggerToggle(trigger)}
                          />
                          <Label
                            htmlFor={trigger}
                            className="text-sm capitalize"
                          >
                            {trigger}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="date" className="text-base font-medium">
                      Date
                    </Label>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border mt-2"
                      disabled={(date) => date > new Date()}
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes" className="text-base font-medium">
                      Additional notes (optional)
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="Describe your day, thoughts, or anything else you'd like to track..."
                      value={newEntry.notes}
                      onChange={(e) =>
                        setNewEntry((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      className="mt-2 min-h-[120px]"
                    />
                  </div>
                </div>
              </div>

              {newEntry.mood[0] <= 3 && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-900">
                      Low Mood Detected
                    </h4>
                    <p className="text-sm text-red-700 mt-1">
                      We're concerned about your well-being. Consider reaching
                      out to a counselor or trusted friend. If you're having
                      thoughts of self-harm, please contact emergency services
                      immediately.
                    </p>
                    <Button
                      size="sm"
                      className="mt-3"
                      onClick={() => router.push("/student/find-counselor")}
                    >
                      Find Support
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex gap-4 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowAddEntry(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveEntry}>Save Entry</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mood History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Mood History
            </CardTitle>
            <CardDescription>
              Your recent mood entries and patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* {userMoods.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Heart className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-2">No mood entries yet</h3>
                <p className="text-sm mb-4">Start tracking your mood to identify patterns and trends</p>
                <Button onClick={() => setShowAddEntry(true)}>
                  Add Your First Entry
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {userMoods.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0 pt-1">
                      {getMoodIcon(entry.mood)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">
                            {entry.date.toLocaleDateString()}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getMoodColor(entry.mood)}`}></div>
                            <span className="text-sm font-medium">{entry.mood}/10</span>
                          </div>
                        </div>
                        {entry.isEmergency && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Flagged
                          </Badge>
                        )}
                      </div>
                      
                      {entry.emotions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {entry.emotions.map((emotion) => (
                            <Badge key={emotion} variant="secondary" className="text-xs">
                              {emotion}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {entry.notes && (
                        <p className="text-sm text-muted-foreground mb-2">{entry.notes}</p>
                      )}
                      
                      {entry.triggers && entry.triggers.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-muted-foreground">Triggers:</span>
                          {entry.triggers.map((trigger) => (
                            <Badge key={trigger} variant="outline" className="text-xs">
                              {trigger}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {userMoods.length > 10 && (
                  <div className="text-center pt-4">
                    <Button variant="outline">
                      Load More Entries
                    </Button>
                  </div>
                )}
              </div>
            )} */}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
