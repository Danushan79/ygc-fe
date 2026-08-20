"use client";

import { FileText, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

const NAV_ITEMS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Documents", href: "/documents", icon: FileText },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 flex-shrink-0 flex-col border-r border-slate-200/80 bg-white">
      <div className="px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-indigo-700 text-white shadow-sm shadow-blue-900/20">
            <LayoutDashboard className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-blue-800">CliniCore</p>
            <p className="text-xs text-slate-500">Patient Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-gradient-to-r from-blue-50 to-blue-50/40 text-blue-800 shadow-sm ring-1 ring-blue-900/5"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <item.icon className="h-5 w-5" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
