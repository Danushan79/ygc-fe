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
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-white via-slate-50 to-indigo-50 px-4 py-16 sm:px-6">
      <div
        className="pointer-events-none absolute inset-x-0 -top-32 -z-10 flex justify-center blur-3xl"
        aria-hidden
      >
        <div className="aspect-[1155/678] w-[50rem] flex-none bg-gradient-to-tr from-blue-200 via-indigo-200 to-sky-100 opacity-40" />
      </div>

      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 shadow-sm ring-1 ring-blue-900/5">
            {icon}
          </div>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-2 text-slate-500">{subtitle}</p>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-100 bg-white/90 p-8 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/[0.03] backdrop-blur-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
