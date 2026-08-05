import { TriangleAlert } from "lucide-react";
import type { CrossCheckIssue, DuplicatePrescription, PotentialDrugInteraction } from "@/types/document";

interface SafetyAlertsCardProps {
  interactions: PotentialDrugInteraction[];
  duplicates: DuplicatePrescription[];
  conflictingDosage: CrossCheckIssue[];
  allergyConflicts: CrossCheckIssue[];
}

function describeIssue(issue: CrossCheckIssue): string {
  if (typeof issue === "string") {
    return issue;
  }
  return issue.explanation ?? issue.medication ?? "Details unavailable.";
}

interface Alert {
  key: string;
  title: string;
  description: string;
  severity?: string;
}

const SEVERITY_STYLES: Record<string, string> = {
  high: "border-red-300 bg-red-100",
  moderate: "border-red-200 bg-red-50",
  low: "border-orange-200 bg-orange-50",
};

export function SafetyAlertsCard({
  interactions,
  duplicates,
  conflictingDosage,
  allergyConflicts,
}: SafetyAlertsCardProps) {
  const alerts: Alert[] = [
    ...interactions.map((interaction, index) => ({
      key: `interaction-${index}`,
      title: `Drug Interaction: ${interaction.medications_involved.join(" + ")}`,
      description: interaction.explanation,
      severity: interaction.severity,
    })),
    ...duplicates.map((duplicate, index) => ({
      key: `duplicate-${index}`,
      title: `Duplicate Prescription: ${duplicate.medication}`,
      description: `${duplicate.explanation} (${duplicate.occurrences.length} occurrences)`,
    })),
    ...conflictingDosage.map((conflict, index) => ({
      key: `dosage-${index}`,
      title: "Conflicting Dosage",
      description: describeIssue(conflict),
    })),
    ...allergyConflicts.map((conflict, index) => ({
      key: `allergy-${index}`,
      title: "Allergy Conflict",
      description: describeIssue(conflict),
    })),
  ];

  return (
    <div className="flex-shrink-0 rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between rounded-t-lg border-b border-slate-200 bg-red-50 p-2.5">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
          <TriangleAlert className="h-4.5 w-4.5 text-red-600" strokeWidth={2} />
          Safety Alerts
        </h3>
        <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
          {alerts.length}
        </span>
      </div>

      <div className="space-y-2 p-2.5">
        {alerts.length === 0 ? (
          <p className="p-1 text-xs text-slate-500">No safety alerts found.</p>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.key}
              className={`rounded border p-2 ${
                (alert.severity && SEVERITY_STYLES[alert.severity]) ?? "border-red-200 bg-red-50"
              }`}
            >
              <h4 className="mb-0.5 flex items-center gap-1 text-xs font-semibold text-red-700">
                <TriangleAlert className="h-3.5 w-3.5" strokeWidth={2} />
                {alert.title}
              </h4>
              <p className="text-[11px] leading-tight text-slate-900">{alert.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
