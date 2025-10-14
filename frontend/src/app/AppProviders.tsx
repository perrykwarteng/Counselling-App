"use client";

import { AdminProvider } from "@/Context/AdminCounselorProvider";
import { AdminResourcesProvider } from "@/Context/AdminResourcesProvider";
import { AdminReferralProvider } from "@/Context/AdminReferralsProvider";
import { AdminStudentsProvider } from "@/Context/AdminStudentrProvider";
import { AdminLogsProvider } from "@/Context/AdminLogsProvider";
import { AuthProvider } from "@/Context/AuthProvider";
import { AppointmentProvider } from "@/Context/AppointmentProviders";
import { VideoSessionProvider } from "@/Context/VideoSessionProvider";
import { ProfileProvider } from "@/Context/ProfileProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProfileProvider>
        <VideoSessionProvider>
          <AdminLogsProvider>
            <AdminReferralProvider>
              <AdminResourcesProvider>
                <AdminStudentsProvider>
                  <AdminProvider>
                    <AppointmentProvider>{children}</AppointmentProvider>
                  </AdminProvider>
                </AdminStudentsProvider>
              </AdminResourcesProvider>
            </AdminReferralProvider>
          </AdminLogsProvider>
        </VideoSessionProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}
