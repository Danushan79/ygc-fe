import { CircleAlert, CircleCheck } from "lucide-react";
import type { ReactNode } from "react";

export function FormBanner({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  const isError = tone === "error";
  const Icon = isError ? CircleAlert : CircleCheck;

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
        isError
          ? "border-red-200 bg-red-50/80 text-red-700"
          : "border-emerald-200 bg-emerald-50/80 text-emerald-700"
      }`}
    >
      <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" strokeWidth={2} />
      <span>{children}</span>
    </div>
  );
}
