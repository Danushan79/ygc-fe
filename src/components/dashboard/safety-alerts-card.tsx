import { ArrowLeftRight, FileText, TriangleAlert } from "lucide-react";
import type {
  CrossCheckIssue,
  DuplicatePrescription,
  PotentialDrugInteraction,
  SourceDocumentRef,
} from "@/types/document";

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

/** De-dupes and drops entries with no filename to key on — an alert with
 * a document reference that carries no source_file can't be grouped. */
function dedupeDocuments(docs: SourceDocumentRef[]): SourceDocumentRef[] {
  const seen = new Set<string>();
  const result: SourceDocumentRef[] = [];
  for (const doc of docs) {
    if (!doc.source_file) continue;
    const key = `${doc.date ?? ""}__${doc.source_file}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(doc);
  }
  return result;
}

/** Same document set -> same group, regardless of finding order. */
function documentGroupKey(docs: SourceDocumentRef[]): string {
  if (docs.length === 0) return "__unattributed__";
  return docs
    .map((d) => d.source_file ?? "")
    .sort()
    .join("||");
}

interface Alert {
  key: string;
  title: string;
  description: string;
  severity?: string;
  documents: SourceDocumentRef[];
}

interface AlertGroup {
  documents: SourceDocumentRef[];
  alerts: Alert[];
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
      documents: dedupeDocuments(interaction.source_documents ?? []),
    })),
    ...duplicates.map((duplicate, index) => ({
      key: `duplicate-${index}`,
      title: `Duplicate Prescription: ${duplicate.medication}`,
      description: `${duplicate.explanation} (${duplicate.occurrences.length} occurrences)`,
      documents: dedupeDocuments(duplicate.occurrences),
    })),
    ...conflictingDosage.map((conflict, index) => ({
      key: `dosage-${index}`,
      title: "Conflicting Dosage",
      description: describeIssue(conflict),
      documents: dedupeDocuments(
        typeof conflict === "string" ? [] : (conflict.conflicting_instructions ?? []),
      ),
    })),
    ...allergyConflicts.map((conflict, index) => ({
      key: `allergy-${index}`,
      title: "Allergy Conflict",
      description: describeIssue(conflict),
      documents: dedupeDocuments(typeof conflict === "string" ? [] : (conflict.source_documents ?? [])),
    })),
  ];

  // Group findings by the exact set of documents they trace back to, so an
  // interaction between the same two documents (e.g. a migraine script and a
  // thyroid script) reads as one story instead of scattered, unrelated cards.
  const groups: AlertGroup[] = [];
  const groupIndex = new Map<string, number>();
  for (const alert of alerts) {
    const key = documentGroupKey(alert.documents);
    const existingIndex = groupIndex.get(key);
    if (existingIndex !== undefined) {
      groups[existingIndex].alerts.push(alert);
    } else {
      groupIndex.set(key, groups.length);
      groups.push({ documents: alert.documents, alerts: [alert] });
    }
  }

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

      <div className="space-y-2.5 p-2.5">
        {alerts.length === 0 ? (
          <p className="p-1 text-xs text-slate-500">No safety alerts found.</p>
        ) : (
          groups.map((group, groupIdx) => (
            <div key={groupIdx} className="overflow-hidden rounded-md border border-slate-200">
              <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
                {group.documents.length === 0 ? (
                  <span className="text-[10px] font-medium tracking-wide text-slate-400 uppercase">
                    Source document unclear
                  </span>
                ) : (
                  group.documents.map((doc, docIdx) => (
                    <span key={docIdx} className="inline-flex items-center gap-1">
                      {docIdx > 0 && (
                        <ArrowLeftRight className="h-3 w-3 shrink-0 text-slate-400" strokeWidth={2} />
                      )}
                      <span
                        title={doc.date ? `${doc.source_file} · ${doc.date}` : doc.source_file}
                        className="inline-flex max-w-[160px] items-center gap-1 rounded-full border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-700 shadow-sm"
                      >
                        <FileText className="h-3 w-3 shrink-0 text-slate-500" strokeWidth={2} />
                        <span className="truncate">{doc.source_file}</span>
                        {doc.date && <span className="shrink-0 text-slate-400">· {doc.date}</span>}
                      </span>
                    </span>
                  ))
                )}
              </div>

              <div className="space-y-2 bg-white p-2">
                {group.alerts.map((alert) => (
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
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
