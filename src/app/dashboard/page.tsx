import { AskAiCard } from "@/components/dashboard/ask-ai-card";
import { CurrentMedicationsCard } from "@/components/dashboard/current-medications-card";
import { HealthTimelineCard } from "@/components/dashboard/health-timeline-card";
import { LabTrendsCard } from "@/components/dashboard/lab-trends-card";
import { SafetyAlertsCard } from "@/components/dashboard/safety-alerts-card";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { getCurrentUser, requireSession } from "@/lib/auth/session";

export default async function DashboardPage() {
  await requireSession();
  const user = await getCurrentUser();

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex flex-shrink-0 items-end justify-between">
        <div>
          <h2 className="text-2xl leading-tight font-bold text-slate-900">
            Welcome, <span className="text-blue-800">{user?.fullName ?? "there"}</span>
          </h2>
          <p className="mt-1 text-sm text-slate-500">Here&apos;s your health timeline overview.</p>
        </div>
      </div>

      <SummaryCards />

      <div className="flex min-h-0 flex-1 gap-4">
        <div className="flex h-full min-w-0 flex-[2] flex-col gap-4">
          <HealthTimelineCard />
          <LabTrendsCard />
        </div>

        <div className="flex h-full w-full max-w-sm min-w-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
          <SafetyAlertsCard />
          <CurrentMedicationsCard />
          <AskAiCard />
        </div>
      </div>
    </div>
  );
}
