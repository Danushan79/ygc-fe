"use client";

import { useState } from "react";
import { DoctorRecommendationCard } from "@/components/dashboard/doctor-recommendation-card";
import { HealthTimelineCard } from "@/components/dashboard/health-timeline-card";
import { LabTrendsCard } from "@/components/dashboard/lab-trends-card";
import { SafetyAlertsCard } from "@/components/dashboard/safety-alerts-card";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import type { UploadDocumentsResult } from "@/types/document";

interface DashboardTabsProps {
  documentsData: UploadDocumentsResult | null;
}

type TabId = "overview" | "timeline" | "recommendation";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "timeline", label: "Health Timeline" },
  { id: "recommendation", label: "Recommendation" },
];

export function DashboardTabs({ documentsData }: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 flex flex-shrink-0 items-center gap-1 border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id ? "text-blue-800" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-blue-800" />
            )}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1 pb-1">
          <SummaryCards data={documentsData} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SafetyAlertsCard
              interactions={documentsData?.cross_check_report?.potential_drug_interactions ?? []}
              duplicates={documentsData?.cross_check_report?.duplicate_prescriptions ?? []}
              conflictingDosage={documentsData?.cross_check_report?.conflicting_dosage_instructions ?? []}
              allergyConflicts={documentsData?.cross_check_report?.allergy_conflicts ?? []}
              visits={documentsData?.timeline?.visits ?? []}
            />

            <LabTrendsCard
              labResults={documentsData?.timeline?.lab_results_timeline ?? []}
              trends={documentsData?.lab_trends?.trends ?? []}
              singleResults={documentsData?.lab_trends?.single_results ?? []}
            />
          </div>
        </div>
      ) : activeTab === "timeline" ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <HealthTimelineCard visits={documentsData?.timeline?.visits ?? []} />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1 pb-1">
          <DoctorRecommendationCard consultTriage={documentsData?.consult_triage} />
        </div>
      )}
    </div>
  );
}
