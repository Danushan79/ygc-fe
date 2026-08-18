"use client";

import { useMemo, useState } from "react";
import { ChevronDown, FlaskConical } from "lucide-react";
import { LabTrendChart } from "@/components/dashboard/lab-trend-chart";
import type { LabTrend, SingleLabResult } from "@/types/document";
import { formatLabResult } from "@/utils/lab-result";

interface LabTrendsCardProps {
  labResults: Array<Record<string, unknown>>;
  trends?: LabTrend[];
  singleResults?: SingleLabResult[];
}

type Status = "low" | "normal" | "high" | "unknown";

/** One test, with every reading of it across every document. Readings are
 * grouped per TEST rather than listed per reading, because the raw list
 * repeats a test once per visit and the reader is asking about the test. */
interface TestBlock {
  key: string;
  label: string;
  readings: { value: string; date: string | null; flagged: boolean }[];
  status: Status;
  /** The range the status was judged against, written compactly ("70–100
   * mg/dL", "below 150 mg/dL"). Replaces the prose explanation on the card:
   * it is the one fact from that paragraph a reader actually needs beside
   * the number, and it fits on the row. */
  rangeText?: string;
  trendSummary?: string;
  /** Set only for a test with two or more readings — the chart needs a line
   * to draw, and a single point is a value, not a trend. */
  trend?: LabTrend;
  isMain: boolean;
  /** True when the status came from a general age/sex range rather than the
   * range the patient's own laboratory printed. Surfaced, never hidden. */
  usedGeneralRange: boolean;
  /** Whether the backend assessed this test at all. Qualitative results — a
   * culture reporting "Escherichia coli", a sensitivity reporting
   * "RESISTANT", an appearance of "Deep yellow / Turbid" — have no number to
   * compare, so they carry no status chip. Labelling those "No range on
   * file" implied a comparison had been attempted and come up short, when in
   * truth none was ever applicable. */
  hasAnalysis: boolean;
}

/** "70–100 mg/dL" for a closed range, "below 150 mg/dL" / "above 60 mL/min"
 * for the one-sided ranges labs print for lipids and eGFR. Returns undefined
 * rather than inventing a bound the report never gave. */
function formatRange(
  range: { low: number | null; high: number | null; unit: string } | null | undefined,
): string | undefined {
  if (!range) return undefined;
  const { low, high, unit } = range;
  const suffix = unit ? ` ${unit}` : "";
  if (low !== null && high !== null) return `${low}–${high}${suffix}`;
  if (high !== null) return `below ${high}${suffix}`;
  if (low !== null) return `above ${low}${suffix}`;
  return undefined;
}

const STATUS_STYLES: Record<Status, { chip: string; label: string }> = {
  high: { chip: "bg-red-100 text-red-700", label: "High" },
  low: { chip: "bg-amber-100 text-amber-700", label: "Low" },
  normal: { chip: "bg-green-100 text-green-700", label: "Normal" },
  // Deliberately distinct from "Normal": no range was available to compare
  // against, which is not the same as having compared and found it fine.
  unknown: { chip: "bg-slate-100 text-slate-600", label: "No range on file" },
};

export function LabTrendsCard({
  labResults,
  trends = [],
  singleResults = [],
}: LabTrendsCardProps) {
  const [showAll, setShowAll] = useState(false);

  const blocks = useMemo(() => {
    // Every spelling a test was printed under maps to its analysis, so a
    // reading labelled "FBS" still finds the trend the backend computed
    // under "Fasting Glucose". test_names comes from the backend for exactly
    // this reason — the synonym table is not reimplemented here.
    const trendByName = new Map<string, LabTrend>();
    const singleByName = new Map<string, SingleLabResult>();
    const keyByName = new Map<string, string>();

    for (const trend of trends) {
      const key = trend.test_id ?? trend.test_name.toLowerCase();
      for (const name of trend.test_names ?? [trend.test_name]) {
        trendByName.set(name.toLowerCase(), trend);
        keyByName.set(name.toLowerCase(), key);
      }
    }
    for (const single of singleResults) {
      const key = single.test_id ?? single.test_name.toLowerCase();
      for (const name of single.test_names ?? [single.test_name]) {
        singleByName.set(name.toLowerCase(), single);
        keyByName.set(name.toLowerCase(), key);
      }
    }

    const byKey = new Map<string, TestBlock>();
    for (const raw of labResults) {
      const row = formatLabResult(raw);
      const name = row.label.toLowerCase();
      const key = keyByName.get(name) ?? name;
      const trend = trendByName.get(name);
      const single = singleByName.get(name);

      let block = byKey.get(key);
      if (!block) {
        const lastFlag = trend?.data_points?.at(-1)?.flag?.toLowerCase();
        const status: Status = single
          ? single.status
          : lastFlag === "high" || lastFlag === "low" || lastFlag === "normal"
            ? lastFlag
            : "unknown";

        block = {
          key,
          label: trend?.test_name ?? single?.test_name ?? row.label,
          readings: [],
          status,
          rangeText:
            formatRange(single?.range_used ?? trend?.range_used) ??
            trend?.reference_range ??
            undefined,
          trend,
          trendSummary: trend
            ? `${trend.data_points.length} results — ${trend.direction}`
            : undefined,
          isMain: (trend?.is_main_test ?? single?.is_main_test) === true,
          usedGeneralRange: single?.range_source === "general",
          hasAnalysis: Boolean(trend || single),
        };
        byKey.set(key, block);
      }
      block.readings.push({ value: row.value, date: row.date, flagged: row.flagged });
    }

    // Anything out of range first, then the tests worth showing unprompted,
    // then the rest alphabetically.
    const rank = (b: TestBlock) =>
      (b.status === "high" || b.status === "low" ? 0 : 2) + (b.isMain ? 0 : 1);
    return [...byKey.values()].sort(
      (a, b) => rank(a) - rank(b) || a.label.localeCompare(b.label),
    );
  }, [labResults, trends, singleResults]);

  const abnormalCount = blocks.filter(
    (b) => b.status === "high" || b.status === "low",
  ).length;

  // Main tests, plus anything abnormal regardless of list membership: a
  // result outside its range is never worth burying behind a toggle.
  const alwaysShown = blocks.filter(
    (b) => b.isMain || b.status === "high" || b.status === "low",
  );
  const rest = blocks.filter((b) => !alwaysShown.includes(b));
  const visible = showAll ? blocks : alwaysShown;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-slate-900">Lab Results</h3>
        {blocks.length > 0 && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              abnormalCount > 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
            }`}
          >
            {abnormalCount > 0 ? `${abnormalCount} outside range` : "All within range"}
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {blocks.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 text-slate-400">
            <FlaskConical className="h-6 w-6" strokeWidth={1.5} />
            <p className="text-xs">No lab results yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((block) => {
              const latest = block.readings.at(-1);
              const abnormal = block.status === "high" || block.status === "low";

              return (
                <div
                  key={block.key}
                  className={`rounded-md border p-3 ${
                    abnormal ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">{block.label}</p>
                      <p className="text-xs text-slate-500">
                        {block.trendSummary ?? latest?.date}
                        {block.rangeText && (
                          <span className="text-slate-400">
                            {(block.trendSummary ?? latest?.date) ? " · " : ""}
                            normal {block.rangeText}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <span
                        className={`text-base font-semibold ${
                          abnormal ? "text-red-600" : "text-slate-900"
                        }`}
                      >
                        {latest?.value ?? "—"}
                      </span>
                      {block.hasAnalysis && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            STATUS_STYLES[block.status].chip
                          }`}
                        >
                          {STATUS_STYLES[block.status].label}
                        </span>
                      )}
                    </div>
                  </div>

                  {block.trend && block.trend.data_points.length > 1 && (
                    <LabTrendChart
                      testName={block.label}
                      points={block.trend.data_points}
                      range={block.trend.range_used}
                      referenceRange={block.trend.reference_range}
                      unit={block.trend.unit}
                    />
                  )}

                  {/* The chart's textual twin. Kept deliberately: it is how
                      every plotted value stays reachable without hovering,
                      and it is what a screen reader and a printout get. */}
                  {block.readings.length > 1 && (
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                      {block.readings.map((reading, index) => (
                        <span
                          key={`${block.key}-${index}`}
                          className={`text-xs ${
                            reading.flagged ? "text-red-600" : "text-slate-500"
                          }`}
                        >
                          {reading.date ?? "undated"}: {reading.value}
                        </span>
                      ))}
                    </div>
                  )}

                  {block.usedGeneralRange && (
                    <p className="mt-2 text-xs font-medium text-amber-700">
                      Compared against a general range — your lab did not print one.
                    </p>
                  )}

                  {/* The per-result prose explanation is deliberately NOT
                      rendered here. The value, its range and its status carry
                      the meaning on a dashboard; a paragraph on every row
                      turned the card into a wall of near-identical boilerplate
                      that a reader learns to skip. `explanation` is still
                      computed and still returned by the API, and Q&A answers
                      are grounded in it — this is a presentation choice, not a
                      removal of the underlying assessment. */}
                </div>
              );
            })}

            {rest.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAll((open) => !open)}
                className="flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-200 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${showAll ? "rotate-180" : ""}`}
                  strokeWidth={2}
                />
                {showAll ? "Show fewer" : `Show ${rest.length} more result${rest.length === 1 ? "" : "s"}`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
