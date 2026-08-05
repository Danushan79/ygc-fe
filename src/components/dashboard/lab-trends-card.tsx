import { FlaskConical } from "lucide-react";
import { formatLabResult } from "@/utils/lab-result";

interface LabTrendsCardProps {
  labResults: Array<Record<string, unknown>>;
}

export function LabTrendsCard({ labResults }: LabTrendsCardProps) {
  const rows = labResults.map(formatLabResult);
  const flaggedCount = rows.filter((row) => row.flagged).length;

  return (
    <div className="flex h-48 flex-shrink-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
        <h3 className="text-sm font-semibold text-slate-900">Lab Trends</h3>
        {rows.length > 0 && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
              flaggedCount > 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
            }`}
          >
            {flaggedCount > 0 ? `${flaggedCount} out of range` : "All within range"}
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {rows.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 text-slate-400">
            <FlaskConical className="h-6 w-6" strokeWidth={1.5} />
            <p className="text-xs">No lab results yet</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {rows.map((row, index) => (
              <div
                key={`${row.label}-${index}`}
                className={`flex items-center justify-between rounded border p-1.5 ${
                  row.flagged ? "border-red-100 bg-red-50" : "border-slate-100 bg-slate-50"
                }`}
              >
                <div>
                  <p className="text-xs text-slate-900">{row.label}</p>
                  {row.date && <p className="text-[10px] text-slate-500">{row.date}</p>}
                </div>
                <span
                  className={`text-sm font-semibold ${row.flagged ? "text-red-600" : "text-slate-900"}`}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
