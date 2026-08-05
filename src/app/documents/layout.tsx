import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireCurrentUser } from "@/lib/auth/session";

export default async function DocumentsLayout({ children }: { children: ReactNode }) {
  const user = await requireCurrentUser();

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
