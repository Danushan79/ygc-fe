import { FlaskConical } from "lucide-react";
import type { LabTrend } from "@/types/document";
import { formatLabResult } from "@/utils/lab-result";

interface LabTrendsCardProps {
  labResults: Array<Record<string, unknown>>;
  trends?: LabTrend[];
}

export function LabTrendsCard({ labResults, trends = [] }: LabTrendsCardProps) {
  const rows = labResults.map(formatLabResult);
  const flaggedCount = rows.filter((row) => row.flagged).length;

  // One explanation per test (lab_trends.py generates it from the test's
  // full history, not per-reading), keyed by the same label formatLabResult
  // resolves so it can be matched against each row.
  const explanationByTest = new Map(
    trends.map((trend) => [trend.test_name.toLowerCase(), trend.explanation]),
  );
  // Only surface it on that test's most recent row — repeating the same
  // trend summary on every past reading would just be noise.
  const lastRowIndexByTest = new Map<string, number>();
  rows.forEach((row, index) => lastRowIndexByTest.set(row.label.toLowerCase(), index));

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
            {rows.map((row, index) => {
              const key = row.label.toLowerCase();
              const explanation =
                lastRowIndexByTest.get(key) === index ? explanationByTest.get(key) : undefined;

              return (
                <div
                  key={`${row.label}-${index}`}
                  className={`rounded border p-1.5 ${
                    row.flagged ? "border-red-100 bg-red-50" : "border-slate-100 bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
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
                  {explanation && (
                    <p className="mt-1 text-[10px] leading-snug text-slate-500">{explanation}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
