import { ArrowRight, BadgeCheck, ShieldAlert, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CrossCheckIssue, UploadDocumentsResult } from "@/types/document";
import { isLabResultFlagged } from "@/utils/lab-result";

function issueConfidence(issue: CrossCheckIssue): number | undefined {
  if (typeof issue === "string") {
    return undefined;
  }
  return typeof issue.confidence === "number" ? issue.confidence : undefined;
}

interface SummaryCard {
  title: string;
  linkLabel: string;
  value: string;
  icon: LucideIcon;
  cardClassName: string;
  iconWrapClassName: string;
  titleClassName: string;
  linkClassName: string;
  valueClassName: string;
  valueSizeClassName: string;
}

interface SummaryCardsProps {
  data: UploadDocumentsResult | null;
}

export function SummaryCards({ data }: SummaryCardsProps) {
  const crossCheck = data?.cross_check_report;
  const timeline = data?.timeline;

  const drugInteractionCount = crossCheck?.potential_drug_interactions.length ?? 0;

  const drugConflictCount = crossCheck?.conflicting_dosage_instructions.length ?? 0;

  const labTrendCount = (timeline?.lab_results_timeline ?? []).filter(isLabResultFlagged).length;

  // Prefer confidence in the cross-check ANALYSIS (drug interactions,
  // duplicates, dosage conflicts, allergy conflicts) when there is one.
  const analysisConfidences = [
    ...(crossCheck?.potential_drug_interactions ?? []).map((item) => item.confidence),
    ...(crossCheck?.duplicate_prescriptions ?? []).map((item) => item.confidence),
    ...(crossCheck?.conflicting_dosage_instructions ?? []).map(issueConfidence),
    ...(crossCheck?.allergy_conflicts ?? []).map(issueConfidence),
  ].filter((confidence): confidence is number => typeof confidence === "number");

  // When the cross-check found no issues, there's nothing to average above —
  // fall back to the documents' own extraction confidence so the tile still
  // shows a real number instead of "—" for the common all-clear case.
  const extractionConfidences = (timeline?.visits ?? [])
    .map((visit) => visit.overall_confidence)
    .filter((confidence): confidence is number => typeof confidence === "number");

  const confidenceSource =
    analysisConfidences.length > 0 ? analysisConfidences : extractionConfidences;

  const avgConfidence =
    confidenceSource.length > 0
      ? Math.round(
          (confidenceSource.reduce((sum, confidence) => sum + confidence, 0) /
            confidenceSource.length) *
            100,
        )
      : null;

  const summaryCards: SummaryCard[] = [
    {
      title: "Confidence",
      linkLabel: avgConfidence !== null && avgConfidence >= 80 ? "High" : "Review",
      value: avgConfidence !== null ? `${avgConfidence}%` : "—",
      icon: BadgeCheck,
      cardClassName: "bg-slate-100 border-slate-200",
      iconWrapClassName: "bg-blue-100 text-blue-700",
      titleClassName: "text-slate-900",
      linkClassName: "text-slate-500",
      valueClassName: "text-blue-700",
      valueSizeClassName: "text-3xl",
    },
    {
      title: "Drug Interaction",
      linkLabel: drugInteractionCount > 0 ? "Review needed" : "No interactions",
      value: String(drugInteractionCount),
      icon: TriangleAlert,
      cardClassName: "bg-red-50 border-red-200",
      iconWrapClassName: "bg-red-100 text-red-600",
      titleClassName: "text-red-950",
      linkClassName: "text-red-800",
      valueClassName: "text-red-600",
      valueSizeClassName: "text-xl",
    },
    {
      title: "Drug Conflict",
      linkLabel: drugConflictCount > 0 ? "Review needed" : "No conflicts",
      value: String(drugConflictCount),
      icon: ShieldAlert,
      cardClassName: "bg-yellow-50 border-yellow-200",
      iconWrapClassName: "bg-yellow-100 text-yellow-700",
      titleClassName: "text-yellow-900",
      linkClassName: "text-yellow-800",
      valueClassName: "text-yellow-700",
      valueSizeClassName: "text-xl",
    }
  ];

  return (
    <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {summaryCards.map((card) => (
        <div
          key={card.title}
          className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${card.cardClassName}`}
        >
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-2 ${card.iconWrapClassName}`}>
              <card.icon className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <h3 className={`text-sm leading-tight font-semibold ${card.titleClassName}`}>
                {card.title}
              </h3>
              <button
                type="button"
                className={`mt-0.5 flex items-center gap-1 text-xs hover:underline ${card.linkClassName}`}
              >
                {card.linkLabel}
                <ArrowRight className="h-3 w-3" strokeWidth={2} />
              </button>
            </div>
          </div>
          <span className={`font-bold ${card.valueSizeClassName} ${card.valueClassName}`}>
            {card.value}
          </span>
        </div>
      ))}
    </div>
  );
}
