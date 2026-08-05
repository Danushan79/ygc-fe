"use client";

import {
  Activity,
  FileText,
  History,
  LayoutDashboard,
  MessageCircle,
  Pill,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

const NAV_ITEMS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Timeline", href: "/dashboard/timeline", icon: History },
  { label: "Medications", href: "/dashboard/medications", icon: Pill },
  { label: "Lab Trends", href: "/dashboard/lab-trends", icon: Activity },
  { label: "Documents", href: "/dashboard/documents", icon: FileText },
  { label: "Safety Alerts", href: "/dashboard/safety-alerts", icon: TriangleAlert },
  { label: "Ask Questions", href: "/dashboard/ask-questions", icon: MessageCircle },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 flex-shrink-0 flex-col border-r border-slate-200 bg-slate-50">
      <div className="px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-800 text-white">
            <LayoutDashboard className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-lg font-bold text-blue-800">CliniCore</p>
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
              className={`flex items-center gap-3 rounded-md border-l-4 px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "border-blue-700 bg-blue-50 text-blue-800"
                  : "border-transparent text-slate-600 hover:bg-slate-100"
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
