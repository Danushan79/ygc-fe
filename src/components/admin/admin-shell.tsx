import { CircleHelp } from "lucide-react";
import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { ProfileMenuButton } from "@/components/account/profile-menu-button";
import type { AuthUserDto } from "@/types/auth";

export function AdminShell({ user, children }: { user: AuthUserDto; children: ReactNode }) {
  return (
    <div className="flex flex-1">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 flex-shrink-0 items-center justify-end gap-4 border-b border-slate-200/80 bg-white px-6">
          <button
            type="button"
            aria-label="Help"
            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <CircleHelp className="h-6 w-6" strokeWidth={1.75} />
          </button>
          <ProfileMenuButton user={user} profileHref="/admin/profile" />
        </header>
        <main className="flex-1 overflow-y-auto bg-[#f4f6fb] p-6">{children}</main>
      </div>
    </div>
  );
}
