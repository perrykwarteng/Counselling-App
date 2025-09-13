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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  User,
  FileText,
  AlertCircle,
} from "lucide-react";
import { AdminSidebar } from "@/components/adminSidebar/AdminSidebar";
// import { mockReferrals, mockCounselors, mockStudents } from '@/lib/mock-data';
// import { Referral } from '@/types';

export default function AdminReferralsPage() {
  // const { user, loading } = useAuth();
  const router = useRouter();
  // const [referrals, setReferrals] = useState<Referral[]>(mockReferrals);
  const [showCreateReferral, setShowCreateReferral] = useState(false);
  // const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);

  const [newReferral, setNewReferral] = useState({
    fromCounselorId: "",
    toCounselorId: "",
    studentId: "",
    reason: "",
    notes: "",
  });

  // useEffect(() => {
  //   if (!loading && (!user || user.role !== 'admin')) {
  //     router.push('/');
  //   }
  // }, [user, loading, router]);

  // if (loading || !user) {
  //   return <div>Loading...</div>;
  // }

  // const handleCreateReferral = () => {
  //   const referral: Referral = {
  //     id: Math.random().toString(36).substr(2, 9),
  //     fromCounselorId: newReferral.fromCounselorId,
  //     toCounselorId: newReferral.toCounselorId,
  //     studentId: newReferral.studentId,
  //     reason: newReferral.reason,
  //     status: 'pending',
  //     createdAt: new Date(),
  //     notes: newReferral.notes
  //   };

  //   setReferrals(prev => [referral, ...prev]);
  //   setNewReferral({
  //     fromCounselorId: '',
  //     toCounselorId: '',
  //     studentId: '',
  //     reason: '',
  //     notes: ''
  //   });
  //   setShowCreateReferral(false);
  // };

  // const handleUpdateReferralStatus = (referralId: string, status: 'accepted' | 'declined') => {
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
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
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

  // const pendingReferrals = referrals.filter(ref => ref.status === 'pending');
  // const completedReferrals = referrals.filter(ref => ref.status !== 'pending');

  return (
    <DashboardLayout title="Student Referrals" sidebar={<AdminSidebar />}>
      <div className="space-y-6">
        {/* Header with Create Button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Student Referrals</h2>
            <p className="text-muted-foreground">
              Manage counselor-to-counselor student referrals
            </p>
          </div>
          <Dialog
            open={showCreateReferral}
            onOpenChange={setShowCreateReferral}
          >
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Create Referral
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Referral</DialogTitle>
                <DialogDescription>
                  Refer a student from one counselor to another for specialized
                  care
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>From Counselor</Label>
                    <Select
                      value={newReferral.fromCounselorId}
                      onValueChange={(value) =>
                        setNewReferral((prev) => ({
                          ...prev,
                          fromCounselorId: value,
                        }))
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select referring counselor" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* {mockCounselors.map((counselor) => (
                          <SelectItem key={counselor.id} value={counselor.id}>
                            {counselor.firstName} {counselor.lastName} ({counselor.type})
                          </SelectItem>
                        ))} */}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>To Counselor</Label>
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
                        <SelectValue placeholder="Select receiving counselor" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* {mockCounselors.map((counselor) => (
                          <SelectItem key={counselor.id} value={counselor.id}>
                            {counselor.firstName} {counselor.lastName} ({counselor.type})
                          </SelectItem>
                        ))} */}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Student</Label>
                  <Select
                    value={newReferral.studentId}
                    onValueChange={(value) =>
                      setNewReferral((prev) => ({ ...prev, studentId: value }))
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
                  <Label>Reason for Referral</Label>
                  <Textarea
                    placeholder="Explain why this student needs to be referred to another counselor..."
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
                  <Label>Additional Notes</Label>
                  <Textarea
                    placeholder="Any additional information for the receiving counselor..."
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
                      !newReferral.fromCounselorId ||
                      !newReferral.toCounselorId ||
                      !newReferral.studentId ||
                      !newReferral.reason
                    }
                  >
                    Create Referral
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Referrals
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {/* {pendingReferrals.length} */}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting response</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {/* {referrals.filter((ref) => ref.status === "accepted").length} */}
              </div>
              <p className="text-xs text-muted-foreground">
                Successfully transferred
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Referrals
              </CardTitle>
              <UserPlus className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {/* <div className="text-2xl font-bold">{referrals.length}</div> */}
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Referrals */}
        {/* {pendingReferrals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                Pending Referrals ({pendingReferrals.length})
              </CardTitle>
              <CardDescription>
                Referrals awaiting counselor response
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingReferrals.map((referral) => (
                <div key={referral.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(referral.status)}
                        <Badge variant={getStatusColor(referral.status) as any}>
                          {referral.status}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Created {referral.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleUpdateReferralStatus(referral.id, "accepted")
                        }
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleUpdateReferralStatus(referral.id, "declined")
                        }
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        FROM COUNSELOR
                      </Label>
                      <p className="font-medium">
                        {getCounselorName(referral.fromCounselorId)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        TO COUNSELOR
                      </Label>
                      <p className="font-medium">
                        {getCounselorName(referral.toCounselorId)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        STUDENT
                      </Label>
                      <p className="font-medium">
                        {getStudentName(referral.studentId)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        REASON
                      </Label>
                      <p className="text-sm">{referral.reason}</p>
                    </div>
                    {referral.notes && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          NOTES
                        </Label>
                        <p className="text-sm">{referral.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )} */}

        {/* All Referrals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              All Referrals
            </CardTitle>
            <CardDescription>
              Complete history of student referrals
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* {referrals.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <UserPlus className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-2">No referrals yet</h3>
                <p className="text-sm mb-4">
                  Student referrals will appear here when counselors request
                  transfers
                </p>
                <Button onClick={() => setShowCreateReferral(true)}>
                  Create First Referral
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {referrals.map((referral) => (
                  <div key={referral.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(referral.status)}
                          <Badge
                            variant={getStatusColor(referral.status) as any}
                          >
                            {referral.status}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {referral.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedReferral(referral)}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          FROM → TO
                        </Label>
                        <p className="font-medium text-sm">
                          {getCounselorName(referral.fromCounselorId)} →{" "}
                          {getCounselorName(referral.toCounselorId)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          STUDENT
                        </Label>
                        <p className="font-medium text-sm">
                          {getStudentName(referral.studentId)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          REASON
                        </Label>
                        <p className="text-sm truncate">{referral.reason}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )} */}
          </CardContent>
        </Card>

        {/* Referral Details Modal */}
        {/* <Dialog
          open={!!selectedReferral}
          onOpenChange={() => setSelectedReferral(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Referral Details</DialogTitle>
              <DialogDescription>
                Complete information about this student referral
              </DialogDescription>
            </DialogHeader>
            {selectedReferral && (
              <div className="space-y-6 mt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedReferral.status)}
                    <Badge
                      variant={getStatusColor(selectedReferral.status) as any}
                    >
                      {selectedReferral.status}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Created {selectedReferral.createdAt.toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      FROM COUNSELOR
                    </Label>
                    <p className="text-lg font-medium mt-1">
                      {getCounselorName(selectedReferral.fromCounselorId)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      TO COUNSELOR
                    </Label>
                    <p className="text-lg font-medium mt-1">
                      {getCounselorName(selectedReferral.toCounselorId)}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    STUDENT
                  </Label>
                  <p className="text-lg font-medium mt-1">
                    {getStudentName(selectedReferral.studentId)}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    REASON FOR REFERRAL
                  </Label>
                  <p className="text-sm mt-2 p-3 bg-gray-50 rounded-lg">
                    {selectedReferral.reason}
                  </p>
                </div>

                {selectedReferral.notes && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      ADDITIONAL NOTES
                    </Label>
                    <p className="text-sm mt-2 p-3 bg-gray-50 rounded-lg">
                      {selectedReferral.notes}
                    </p>
                  </div>
                )}

                {selectedReferral.status === "pending" && (
                  <div className="flex gap-4 justify-end pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleUpdateReferralStatus(
                          selectedReferral.id,
                          "declined"
                        );
                        setSelectedReferral(null);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Decline Referral
                    </Button>
                    <Button
                      onClick={() => {
                        handleUpdateReferralStatus(
                          selectedReferral.id,
                          "accepted"
                        );
                        setSelectedReferral(null);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept Referral
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog> */}
      </div>
    </DashboardLayout>
  );
}
