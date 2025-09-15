// src/lib/roleRoute.ts
export const routeForRole = (raw?: string) =>
  ((
    {
      admin: "/dashboard/admin",
      student: "/dashboard/student",
      counselor: "/dashboard/counselor",
      counsellor: "/dashboard/counselor",
    } as Record<string, string>
  )[(raw ?? "").toLowerCase().trim()] ?? "/dashboard");
