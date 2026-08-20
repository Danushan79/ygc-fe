import { ArrowLeftRight, FileText, ShieldCheck, TriangleAlert } from "lucide-react";
import type {
  CrossCheckIssue,
  DocumentVisit,
  DuplicatePrescription,
  PotentialDrugInteraction,
  SourceDocumentRef,
} from "@/types/document";
import { formatDisplayDate } from "@/utils/date";

interface SafetyAlertsCardProps {
  interactions: PotentialDrugInteraction[];
  duplicates: DuplicatePrescription[];
  conflictingDosage: CrossCheckIssue[];
  allergyConflicts: CrossCheckIssue[];
  visits: DocumentVisit[];
}

/** Same key `dedupeDocuments` groups on below, so a finding's document
 * reference resolves to the exact upload it came from rather than any
 * document that happens to share a filename. */
function documentRefKey(date: string | undefined, sourceFile: string): string {
  return `${date ?? ""}__${sourceFile}`;
}

function buildDocumentUrlLookup(visits: DocumentVisit[]): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const visit of visits) {
    const sourceFile = visit._source?.file;
    if (!sourceFile || !visit.document_url) continue;
    lookup.set(documentRefKey(visit.date, sourceFile), visit.document_url);
  }
  return lookup;
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
  high: "border-l-red-500 bg-red-50/60",
  moderate: "border-l-red-400 bg-red-50/40",
  low: "border-l-orange-400 bg-orange-50/40",
};
const DEFAULT_SEVERITY_STYLE = "border-l-red-300 bg-red-50/30";

export function SafetyAlertsCard({
  interactions,
  duplicates,
  conflictingDosage,
  allergyConflicts,
  visits,
}: SafetyAlertsCardProps) {
  const documentUrls = buildDocumentUrlLookup(visits);
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
    <div className="flex-shrink-0 rounded-2xl border border-slate-200/70 bg-white shadow-sm ring-1 ring-slate-900/[0.02]">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3.5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <TriangleAlert className="h-4 w-4" strokeWidth={2.25} />
          </span>
          Drug Interaction & Conflict
        </h3>
        <span className="flex-shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
          {alerts.length}
        </span>
      </div>

      <div className="space-y-3 p-4">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1.5 py-6 text-slate-400">
            <ShieldCheck className="h-6 w-6" strokeWidth={1.5} />
            <p className="text-xs">No safety alerts found.</p>
          </div>
        ) : (
          groups.map((group, groupIdx) => (
            <div key={groupIdx} className="overflow-hidden rounded-xl border border-slate-200/70 bg-white">
              <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 bg-slate-50/60 px-3 py-2">
                {group.documents.length === 0 ? (
                  <span className="text-[10px] font-medium tracking-wide text-slate-400 uppercase">
                    Source document unclear
                  </span>
                ) : (
                  group.documents.map((doc, docIdx) => {
                    const displayDate = formatDisplayDate(doc.date);
                    const url = doc.source_file
                      ? documentUrls.get(documentRefKey(doc.date, doc.source_file))
                      : undefined;
                    const chipClassName =
                      "inline-flex max-w-[160px] items-center gap-1 rounded-full border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-700 shadow-sm";
                    const chipContent = (
                      <>
                        <FileText className="h-3 w-3 shrink-0 text-slate-500" strokeWidth={2} />
                        <span className="truncate">{doc.source_file}</span>
                        {displayDate && <span className="shrink-0 text-slate-400">· {displayDate}</span>}
                      </>
                    );

                    return (
                      <span key={docIdx} className="inline-flex items-center gap-1">
                        {docIdx > 0 && (
                          <ArrowLeftRight className="h-3 w-3 shrink-0 text-slate-400" strokeWidth={2} />
                        )}
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={displayDate ? `${doc.source_file} · ${displayDate}` : doc.source_file}
                            className={`${chipClassName} hover:border-blue-400 hover:text-blue-800`}
                          >
                            {chipContent}
                          </a>
                        ) : (
                          <span
                            title={displayDate ? `${doc.source_file} · ${displayDate}` : doc.source_file}
                            className={chipClassName}
                          >
                            {chipContent}
                          </span>
                        )}
                      </span>
                    );
                  })
                )}
              </div>

              <div className="space-y-2 p-3">
                {group.alerts.map((alert) => (
                  <div
                    key={alert.key}
                    className={`rounded-lg border-l-4 p-2.5 shadow-sm shadow-slate-900/5 transition-shadow hover:shadow-md hover:shadow-slate-900/10 ${
                      (alert.severity && SEVERITY_STYLES[alert.severity]) ?? DEFAULT_SEVERITY_STYLE
                    }`}
                  >
                    <h4 className="mb-0.5 flex items-center gap-1.5 text-xs font-semibold text-red-700">
                      <TriangleAlert className="h-3.5 w-3.5" strokeWidth={2} />
                      {alert.title}
                    </h4>
                    <p className="text-[11px] leading-relaxed text-slate-600">{alert.description}</p>
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
