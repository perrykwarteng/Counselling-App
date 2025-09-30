"use client";

import { AdminProvider } from "@/Context/AdminCounselorProvider";
import { AdminResourcesProvider } from "@/Context/AdminResourcesProvider";
import { AdminReferralProvider } from "@/Context/AdminReferralsProvider";
import { AdminStudentsProvider } from "@/Context/AdminStudentrProvider";
import { AdminLogsProvider } from "@/Context/AdminLogsProvider";
import { AuthProvider } from "@/Context/AuthProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminLogsProvider>
        <AdminReferralProvider>
          <AdminResourcesProvider>
            <AdminStudentsProvider>
              <AdminProvider>{children}</AdminProvider>
            </AdminStudentsProvider>
          </AdminResourcesProvider>
        </AdminReferralProvider>
      </AdminLogsProvider>
    </AuthProvider>
  );
}
