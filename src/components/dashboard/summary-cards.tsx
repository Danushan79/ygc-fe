import { ArrowRight, BadgeCheck, Pill, TrendingUp, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { UploadDocumentsResult } from "@/types/document";
import { isLabResultFlagged } from "@/utils/lab-result";

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

  const visitConfidences = (timeline?.visits ?? [])
    .map((visit) => visit.overall_confidence)
    .filter((confidence): confidence is number => typeof confidence === "number");
  const avgConfidence =
    visitConfidences.length > 0
      ? Math.round(
          (visitConfidences.reduce((sum, confidence) => sum + confidence, 0) / visitConfidences.length) * 100
        )
      : null;

  const summaryCards: SummaryCard[] = [
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
    },
    {
      title: "Lab Trend",
      linkLabel: labTrendCount > 0 ? "Out of range" : "Within range",
      value: String(labTrendCount),
      icon: TrendingUp,
      cardClassName: "bg-green-50 border-green-200",
      iconWrapClassName: "bg-green-100 text-green-700",
      titleClassName: "text-green-900",
      linkClassName: "text-green-800",
      valueClassName: "text-green-700",
    },
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
    },
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
          <span className={`text-xl font-bold ${card.valueClassName}`}>{card.value}</span>
        </div>
      ))}
    </div>
  );
}
