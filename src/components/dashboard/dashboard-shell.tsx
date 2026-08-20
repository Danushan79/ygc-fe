import type { ReactNode } from "react";
import { ProfileMenuButton } from "@/components/account/profile-menu-button";
import { AiAssistantWidget } from "@/components/dashboard/ai-assistant-widget";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import type { AuthUserDto } from "@/types/auth";

export function DashboardShell({ user, children }: { user: AuthUserDto; children: ReactNode }) {
  return (
    <div className="flex flex-1">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 flex-shrink-0 items-center justify-end gap-4 border-b border-slate-200/80 bg-white px-4">
          <ProfileMenuButton user={user} profileHref="/dashboard/profile" />
        </header>

        <main className="flex-1 overflow-y-auto bg-[#f4f6fb] p-4">{children}</main>
      </div>

      <AiAssistantWidget />
    </div>
  );
}
