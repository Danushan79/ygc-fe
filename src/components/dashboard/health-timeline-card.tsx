import { ArrowUp, FileText, FlaskConical, ListFilter, Pill, Stethoscope } from "lucide-react";

interface LabResult {
  label: string;
  value: string;
  flagged: boolean;
}

interface TimelineEntry {
  date: string;
  type: string;
  location: string;
  icon: typeof Stethoscope;
  isNew?: boolean;
  medication?: { name: string; instructions: string };
  labResults: LabResult[];
  note?: string;
}

const TIMELINE_ENTRIES: TimelineEntry[] = [
  {
    date: "Jul 15, 2026",
    type: "Clinic Visit",
    location: "City Medical Clinic",
    icon: Stethoscope,
    isNew: true,
    medication: { name: "Metformin 500 mg", instructions: "Take 1 tablet twice daily with meals" },
    labResults: [{ label: "HbA1c", value: "7.8%", flagged: true }],
    note: "Notes: Follow up in 3 months",
  },
  {
    date: "Mar 10, 2026",
    type: "Lab Test",
    location: "HealthLab",
    icon: FlaskConical,
    labResults: [
      { label: "HbA1c", value: "7.3%", flagged: true },
      { label: "LDL Cholesterol", value: "130 mg/dL", flagged: true },
    ],
  },
];

export function HealthTimelineCard() {
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 p-3">
        <h3 className="text-base font-semibold text-slate-900">Your Health Timeline</h3>
        <button
          type="button"
          className="flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 transition-colors hover:bg-slate-100"
        >
          <ListFilter className="h-3.5 w-3.5" strokeWidth={2} />
          Filter
        </button>
      </div>

      <div className="relative flex-1 overflow-y-auto p-4 pl-6">
        <div className="absolute top-4 bottom-0 left-[27px] w-px bg-slate-200" />

        <div className="space-y-6">
          {TIMELINE_ENTRIES.map((entry) => (
            <div key={entry.date} className="relative pl-8">
              <div className="absolute top-0 -left-0.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-blue-800 text-white ring-4 ring-white">
                <entry.icon className="h-3.5 w-3.5" strokeWidth={2} />
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-blue-800">{entry.date}</h4>
                    <p className="text-xs font-semibold text-slate-900">
                      {entry.type}{" "}
                      <span className="font-normal text-slate-500">• {entry.location}</span>
                    </p>
                  </div>
                  {entry.isNew && (
                    <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-800 uppercase">
                      New
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {entry.medication && (
                    <div className="flex gap-2">
                      <Pill
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600"
                        strokeWidth={2}
                      />
                      <div>
                        <p className="text-xs text-slate-900">Medications</p>
                        <p className="text-sm text-slate-900">{entry.medication.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {entry.medication.instructions}
                        </p>
                      </div>
                    </div>
                  )}

                  {entry.labResults.length > 0 && (
                    <div className="flex gap-2">
                      <FlaskConical
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-800"
                        strokeWidth={2}
                      />
                      <div className="w-full space-y-1.5">
                        <p className="text-xs text-slate-900">Lab Results</p>
                        {entry.labResults.map((result) => (
                          <div
                            key={result.label}
                            className="flex items-center justify-between rounded border border-red-100 bg-red-50 p-1.5"
                          >
                            <span className="text-xs text-slate-900">{result.label}</span>
                            <span className="flex items-center gap-1 text-sm font-semibold text-red-600">
                              {result.value}
                              {result.flagged && (
                                <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.5} />
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2">
                  <p className="text-[11px] text-slate-500">{entry.note}</p>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-[11px] font-medium text-blue-800 hover:underline"
                  >
                    View Document
                    <FileText className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
