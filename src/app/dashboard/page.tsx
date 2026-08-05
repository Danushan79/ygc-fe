import { AskAiCard } from "@/components/dashboard/ask-ai-card";
import { HealthTimelineCard } from "@/components/dashboard/health-timeline-card";
import { LabTrendsCard } from "@/components/dashboard/lab-trends-card";
import { SafetyAlertsCard } from "@/components/dashboard/safety-alerts-card";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { getCurrentUser, requireSession } from "@/lib/auth/session";
import { getDocuments } from "@/services/document.service";

export default async function DashboardPage() {
  const session = await requireSession();
  const user = await getCurrentUser();

  let documentsData = null;
  try {
    documentsData = await getDocuments(session.sub);
  } catch (error) {
    console.error("Failed to load dashboard document data:", error);
    documentsData = null;
  }

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

      <SummaryCards data={documentsData} />

      <div className="flex min-h-0 flex-1 gap-4">
        <div className="flex h-full min-w-0 flex-[2] flex-col gap-4">
          <HealthTimelineCard visits={documentsData?.timeline?.visits ?? []} />
          <LabTrendsCard labResults={documentsData?.timeline?.lab_results_timeline ?? []} />
        </div>

        <div className="flex h-full w-full max-w-sm min-w-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
          <SafetyAlertsCard
            interactions={documentsData?.cross_check_report?.potential_drug_interactions ?? []}
            duplicates={documentsData?.cross_check_report?.duplicate_prescriptions ?? []}
            conflictingDosage={documentsData?.cross_check_report?.conflicting_dosage_instructions ?? []}
            allergyConflicts={documentsData?.cross_check_report?.allergy_conflicts ?? []}
          />
          <AskAiCard />
        </div>
      </div>
    </div>
  );
}
