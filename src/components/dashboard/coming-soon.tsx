import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 shadow-sm ring-1 ring-blue-900/5">
        <Icon className="h-7 w-7" strokeWidth={2} />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-slate-900">{title}</h2>
      <p className="max-w-sm text-sm text-slate-500">{description}</p>
    </div>
  );
}
