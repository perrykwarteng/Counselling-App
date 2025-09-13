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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  FileText,
  User,
  ArrowRight,
} from "lucide-react";
import { CounselorSidebar } from "@/components/counselorSidebar/CounselorSidebar";
// import { mockReferrals, mockCounselors, mockStudents } from '@/lib/mock-data';
// import { Referral } from '@/types';

export default function CounselorReferralsPage() {
  // const { user, loading } = useAuth();
  const router = useRouter();
  // const [referrals, setReferrals] = useState<Referral[]>(mockReferrals);
  const [showCreateReferral, setShowCreateReferral] = useState(false);

  const [newReferral, setNewReferral] = useState({
    toCounselorId: "",
    studentId: "",
    reason: "",
    notes: "",
  });

  // useEffect(() => {
  //   if (!loading && (!user || user.role !== 'counselor')) {
  //     router.push('/');
  //   }
  // }, [user, loading, router]);

  // if (loading || !user) {
  //   return <div>Loading...</div>;
  // }

  // Filter referrals for this counselor
  // const sentReferrals = referrals.filter(ref => ref.fromCounselorId === user.id);
  // const receivedReferrals = referrals.filter(ref => ref.toCounselorId === user.id);

  // const handleCreateReferral = () => {
  //   const referral: Referral = {
  //     id: Math.random().toString(36).substr(2, 9),
  //     fromCounselorId: user.id,
  //     toCounselorId: newReferral.toCounselorId,
  //     studentId: newReferral.studentId,
  //     reason: newReferral.reason,
  //     status: 'pending',
  //     createdAt: new Date(),
  //     notes: newReferral.notes
  //   };

  //   setReferrals(prev => [referral, ...prev]);
  //   setNewReferral({
  //     toCounselorId: '',
  //     studentId: '',
  //     reason: '',
  //     notes: ''
  //   });
  //   setShowCreateReferral(false);
  // };

  // const handleRespondToReferral = (referralId: string, status: 'accepted' | 'declined') => {
  //   setReferrals(prev => prev.map(ref =>
  //     ref.id === referralId ? { ...ref, status } : ref
  //   ));
  // };

  // const getCounselorName = (counselorId: string) => {
  //   const counselor = mockCounselors.find(c => c.id === counselorId);
  //   return counselor ? `${counselor.firstName} ${counselor.lastName}` : 'Unknown Counselor';
  // };

  // const getStudentName = (studentId: string) => {
  //   const student = mockStudents.find(s => s.id === studentId);
  //   return student ? `${student.firstName} ${student.lastName}` : 'Unknown Student';
  // };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "accepted":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "declined":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "accepted":
        return "default";
      case "declined":
        return "destructive";
      default:
        return "secondary";
    }
  };

  // const pendingReceived = receivedReferrals.filter(ref => ref.status === 'pending');

  return (
    <DashboardLayout title="Student Referrals" sidebar={<CounselorSidebar />}>
      <div className="space-y-6">
        {/* Header with Create Button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Student Referrals</h2>
            <p className="text-muted-foreground">
              Refer students to other counselors or manage incoming referrals
            </p>
          </div>
          <Dialog
            open={showCreateReferral}
            onOpenChange={setShowCreateReferral}
          >
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Refer Student
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Refer Student to Another Counselor</DialogTitle>
                <DialogDescription>
                  Transfer a student to a counselor with more appropriate
                  expertise
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Student to Refer</Label>
                    <Select
                      value={newReferral.studentId}
                      onValueChange={(value) =>
                        setNewReferral((prev) => ({
                          ...prev,
                          studentId: value,
                        }))
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* {mockStudents.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.firstName} {student.lastName}
                          </SelectItem>
                        ))} */}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Refer to Counselor</Label>
                    <Select
                      value={newReferral.toCounselorId}
                      onValueChange={(value) =>
                        setNewReferral((prev) => ({
                          ...prev,
                          toCounselorId: value,
                        }))
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select counselor" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* {mockCounselors.filter(c => c.id !== user.id).map((counselor) => (
                          <SelectItem key={counselor.id} value={counselor.id}>
                            {counselor.firstName} {counselor.lastName} ({counselor.type})
                          </SelectItem>
                        ))} */}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Reason for Referral</Label>
                  <Textarea
                    placeholder="Explain why this student would benefit from working with another counselor..."
                    value={newReferral.reason}
                    onChange={(e) =>
                      setNewReferral((prev) => ({
                        ...prev,
                        reason: e.target.value,
                      }))
                    }
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Additional Information</Label>
                  <Textarea
                    placeholder="Any additional context, session notes, or recommendations for the receiving counselor..."
                    value={newReferral.notes}
                    onChange={(e) =>
                      setNewReferral((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    className="mt-2"
                  />
                </div>

                <div className="flex gap-4 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateReferral(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={
                      !newReferral.toCounselorId ||
                      !newReferral.studentId ||
                      !newReferral.reason
                    }
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Referral
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Received
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              {/* <div className="text-2xl font-bold">{pendingReceived.length}</div> */}
              <p className="text-xs text-muted-foreground">
                Need your response
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Sent Referrals
              </CardTitle>
              <Send className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {/* <div className="text-2xl font-bold">{sentReferrals.length}</div> */}
              <p className="text-xs text-muted-foreground">Total sent</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Received Referrals
              </CardTitle>
              <UserPlus className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {/* <div className="text-2xl font-bold">{receivedReferrals.length}</div> */}
              <p className="text-xs text-muted-foreground">Total received</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {/* {receivedReferrals.filter(ref => ref.status === 'accepted').length} */}
              </div>
              <p className="text-xs text-muted-foreground">New students</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Received Referrals */}
        {/* {pendingReceived.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <Clock className="h-5 w-5" />
                Pending Referrals ({pendingReceived.length})
              </CardTitle>
              <CardDescription className="text-yellow-700">
                New student referrals requiring your response
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingReceived.map((referral) => (
                <div key={referral.id} className="bg-white border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(referral.status)}
                        <Badge variant="secondary">
                          New Referral
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Received {referral.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleRespondToReferral(referral.id, 'declined')}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleRespondToReferral(referral.id, 'accepted')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">FROM COUNSELOR</Label>
                      <p className="font-medium">{getCounselorName(referral.fromCounselorId)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">STUDENT</Label>
                      <p className="font-medium">{getStudentName(referral.studentId)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">REASON FOR REFERRAL</Label>
                      <p className="text-sm">{referral.reason}</p>
                    </div>
                    {referral.notes && (
                      <div>
                        <Label className="text-xs text-muted-foreground">ADDITIONAL NOTES</Label>
                        <p className="text-sm">{referral.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )} */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sent Referrals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Sent Referrals
              </CardTitle>
              <CardDescription>
                Students you've referred to other counselors
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* {sentReferrals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <h3 className="font-medium mb-2">No referrals sent</h3>
                  <p className="text-sm mb-4">You haven't referred any students yet</p>
                  <Button size="sm" onClick={() => setShowCreateReferral(true)}>
                    Refer a Student
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sentReferrals.map((referral) => (
                    <div key={referral.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(referral.status)}
                          <Badge variant={getStatusColor(referral.status) as any}>
                            {referral.status}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {referral.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">
                          {getStudentName(referral.studentId)}
                        </span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {getCounselorName(referral.toCounselorId)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground truncate">
                        {referral.reason}
                      </p>
                    </div>
                  ))}
                </div>
              )} */}
            </CardContent>
          </Card>

          {/* Received Referrals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Received Referrals
              </CardTitle>
              <CardDescription>
                Students referred to you by other counselors
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* {receivedReferrals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <h3 className="font-medium mb-2">No referrals received</h3>
                  <p className="text-sm">Other counselors haven't referred students to you yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {receivedReferrals.map((referral) => (
                    <div key={referral.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(referral.status)}
                          <Badge variant={getStatusColor(referral.status) as any}>
                            {referral.status}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {referral.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">From </span>
                        <span className="font-medium text-sm">
                          {getCounselorName(referral.fromCounselorId)}
                        </span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">
                          {getStudentName(referral.studentId)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground truncate">
                        {referral.reason}
                      </p>
                    </div>
                  ))}
                </div>
              )} */}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
