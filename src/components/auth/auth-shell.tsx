import type { ReactNode } from "react";

export function AuthShell({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-white via-slate-50 to-indigo-50 px-4 py-16 sm:px-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
            {icon}
          </div>
          <h1 className="mt-5 text-3xl font-extrabold text-slate-900">{title}</h1>
          <p className="mt-2 text-slate-500">{subtitle}</p>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-100 bg-white p-8 shadow-lg shadow-slate-200/50">
          {children}
        </div>
      </div>
    </div>
  );
}
