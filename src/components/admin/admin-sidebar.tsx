"use client";

import { LayoutDashboard, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 flex-shrink-0 flex-col border-r border-slate-200/80 bg-white">
      <div className="px-6 py-6">
        <p className="bg-gradient-to-br from-blue-800 to-indigo-700 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
          CliniCore
        </p>
        <p className="mt-1 text-sm text-slate-500">Admin Portal</p>
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
