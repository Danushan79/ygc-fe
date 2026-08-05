import { Bell, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { ProfileMenuButton } from "@/components/account/profile-menu-button";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { UploadDocumentButton } from "@/components/dashboard/upload-document-button";
import type { AuthUserDto } from "@/types/auth";

export function DashboardShell({ user, children }: { user: AuthUserDto; children: ReactNode }) {
  return (
    <div className="flex flex-1">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 flex-shrink-0 items-center justify-end gap-4 border-b border-slate-200 bg-white px-4">
          <UploadDocumentButton />

          <button
            type="button"
            aria-label="Notifications"
            className="relative rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-800"
          >
            <Bell className="h-5 w-5" strokeWidth={2} />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-600" />
          </button>

          <button
            type="button"
            aria-label="Settings"
            className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-800"
          >
            <Settings className="h-5 w-5" strokeWidth={2} />
          </button>

          <ProfileMenuButton user={user} profileHref="/dashboard/profile" />
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-4">{children}</main>
      </div>
    </div>
  );
}
