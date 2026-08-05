import { ArrowRight, BadgeCheck, Pill, TrendingUp, TriangleAlert } from "lucide-react";
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

  const safetyAlertsCount =
    (crossCheck?.potential_drug_interactions.length ?? 0) +
    (crossCheck?.duplicate_prescriptions.length ?? 0) +
    (crossCheck?.conflicting_dosage_instructions.length ?? 0) +
    (crossCheck?.allergy_conflicts.length ?? 0);

  const medCheckCount = crossCheck?.potential_drug_interactions.length ?? 0;

  const labTrendCount = (timeline?.lab_results_timeline ?? []).filter(isLabResultFlagged).length;

  // Confidence in the cross-check ANALYSIS (drug interactions, duplicates,
  // dosage conflicts, allergy conflicts) — not the OCR/extraction confidence
  // of the source documents (that's a separate, per-document quality signal
  // used elsewhere, e.g. the "needs review" count on documents).
  const analysisConfidences = [
    ...(crossCheck?.potential_drug_interactions ?? []).map((item) => item.confidence),
    ...(crossCheck?.duplicate_prescriptions ?? []).map((item) => item.confidence),
    ...(crossCheck?.conflicting_dosage_instructions ?? []).map(issueConfidence),
    ...(crossCheck?.allergy_conflicts ?? []).map(issueConfidence),
  ].filter((confidence): confidence is number => typeof confidence === "number");

  const avgConfidence =
    analysisConfidences.length > 0
      ? Math.round(
          (analysisConfidences.reduce((sum, confidence) => sum + confidence, 0) /
            analysisConfidences.length) *
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
      title: "Safety Alerts",
      linkLabel: safetyAlertsCount > 0 ? "Review needed" : "All clear",
      value: String(safetyAlertsCount),
      icon: TriangleAlert,
      cardClassName: "bg-red-50 border-red-200",
      iconWrapClassName: "bg-red-100 text-red-600",
      titleClassName: "text-red-950",
      linkClassName: "text-red-800",
      valueClassName: "text-red-600",
      valueSizeClassName: "text-xl",
    },
    {
      title: "Med Check",
      linkLabel: medCheckCount > 0 ? "Interaction found" : "No interactions",
      value: String(medCheckCount),
      icon: Pill,
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
