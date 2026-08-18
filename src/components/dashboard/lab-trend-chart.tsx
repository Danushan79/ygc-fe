"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LabTrendDataPoint } from "@/types/document";

/**
 * One test's readings placed on a real time axis.
 *
 * A single series, so there is no legend — the row heading already names the
 * test, and a one-swatch legend box would just restate it.
 *
 * The x axis is TIME-PROPORTIONAL, not one slot per reading. Evenly spacing
 * four readings taken in 2019, 2024 and twice in 2025 would draw a steady
 * climb where the record actually shows a jump after a five-year gap, which
 * is the one thing a trend chart must not get wrong.
 *
 * Dates and values arrive pre-parsed from the backend (`date_iso`,
 * `value_numeric`). Re-deriving them here would reintroduce the ambiguity
 * lab_trends.py already resolved: "19/12/2023" is 19 December to dateutil and
 * an invalid date to JavaScript's Date, and "> 100,000" is not a number at
 * all until something strips the grouping.
 */

interface LabTrendChartProps {
  points: LabTrendDataPoint[];
  /** Parsed reference bounds. Either side may be null for a one-sided range
   * ("below 100"), in which case the band runs to that edge of the plot. */
  range?: { low: number | null; high: number | null; unit: string } | null;
  /** The printed range string, used only when `range` is absent — snapshots
   * saved before the backend sent parsed bounds still get their band. */
  referenceRange?: string | null;
  unit?: string;
  /** Names the chart for screen readers — the row's test name. */
  testName: string;
}

// Validated against the white card surface with scripts/validate_palette.js:
// CVD ΔE 23.8 (protan) between the two mark colors, both ≥ 3:1 on surface.
const SERIES = "#2a78d6";
const OUT_OF_RANGE = "#d03b3b";
const GRID = "#e1e0d9";
const MUTED = "#898781";
const SURFACE = "#ffffff";

// Right padding is small because no end-label sits there; it only has to keep
// the last marker and its 2px ring off the edge.
const PAD = { top: 14, right: 16, bottom: 26, left: 48 };
// Fixed plot height PLUS the axis band, so the x labels are inside the box
// rather than clipped by it.
const HEIGHT = 150;

/** The number behind a printed value, for snapshots saved before the backend
 * started sending `value_numeric`. Strips digit grouping first, so
 * "> 100,000" is 100000 and not 100. */
function looseNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const match = value.replace(/(?<=\d),(?=\d{3}(?:\D|$))/g, "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

/** Fallback parse of a printed range, mirroring lab_trends._parse_range for
 * the common shapes. Only reached for snapshots saved before the backend
 * started sending parsed bounds; new data never uses this. */
function looseRange(text: string | null | undefined) {
  if (!text) return null;
  const clean = text.replace(/(?<=\d),(?=\d{3}(?:\D|$))/g, "").trim();
  const pair = clean.match(/^(-?\d+(?:\.\d+)?)\s*(?:[-–—]|to)\s*(-?\d+(?:\.\d+)?)/i);
  if (pair) {
    const a = Number(pair[1]);
    const b = Number(pair[2]);
    return { low: Math.min(a, b), high: Math.max(a, b), unit: "" };
  }
  const upper = clean.match(/^(?:<=|≤|<|up to|less than)\s*(-?\d+(?:\.\d+)?)/i);
  if (upper) return { low: null, high: Number(upper[1]), unit: "" };
  const lower = clean.match(/^(?:>=|≥|>|at least|greater than)\s*(-?\d+(?:\.\d+)?)/i);
  if (lower) return { low: Number(lower[1]), high: null, unit: "" };
  return null;
}

function shortDate(iso: string): string {
  // Anchored to midday so a UTC-behind timezone cannot roll the date back a
  // day when it renders.
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
}

export function LabTrendChart({
  points,
  range,
  referenceRange,
  unit,
  testName,
}: LabTrendChartProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  // Measured rather than scaled via viewBox: letting the SVG stretch would
  // scale the type and stroke widths with the card, so a narrow column would
  // render 8px axis labels and a fat line.
  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Parsed bounds where the backend sent them; the printed string parsed
  // here only for older snapshots that predate that field.
  const band = useMemo(() => range ?? looseRange(referenceRange), [range, referenceRange]);

  const model = useMemo(() => {
    // Values fall back to parsing the printed string, so a snapshot saved
    // before the backend sent `value_numeric` still plots rather than
    // silently rendering an empty box.
    const withValues = points
      .map((p) => ({ point: p, value: looseNumber(p.value_numeric ?? p.value) }))
      .filter((p): p is { point: LabTrendDataPoint; value: number } => p.value !== null);
    if (withValues.length < 2 || width <= 0) return null;

    const usable = withValues.map((p) => p.point);
    const values = withValues.map((p) => p.value);

    const plotW = Math.max(width - PAD.left - PAD.right, 10);
    const plotH = HEIGHT - PAD.top - PAD.bottom;

    // A real time axis needs a trustworthy date on EVERY point. `date_iso` is
    // the backend's unambiguous parse; the printed date is not a substitute,
    // because Date.parse reads "19/12/2023" as invalid and "08/22/2024" as a
    // US date — a mix would silently reorder the series. Where any point
    // lacks it, fall back to even spacing, which is still correct: the
    // backend already sorted these chronologically.
    const isoTimes = usable.map((p) =>
      p.date_iso ? new Date(`${p.date_iso}T12:00:00`).getTime() : NaN,
    );
    const timeScaled = isoTimes.every((t) => Number.isFinite(t));
    const tMin = timeScaled ? Math.min(...isoTimes) : 0;
    const span = timeScaled ? Math.max(...isoTimes) - tMin : 0;
    // Readings all on one date (a single panel run) have no time axis to
    // spread across either, so those land on even spacing too.
    const xOf = (i: number) =>
      timeScaled && span > 0
        ? PAD.left + ((isoTimes[i] - tMin) / span) * plotW
        : PAD.left + (i / (usable.length - 1)) * plotW;
    const domain = [...values];
    if (band?.low != null) domain.push(band.low);
    if (band?.high != null) domain.push(band.high);

    let yMin = Math.min(...domain);
    let yMax = Math.max(...domain);
    if (yMin === yMax) {
      yMin -= 1;
      yMax += 1;
    }
    const breathing = (yMax - yMin) * 0.12;
    yMin -= breathing;
    yMax += breathing;
    const yOf = (v: number) =>
      PAD.top + (1 - (v - yMin) / (yMax - yMin)) * plotH;

    return {
      usable,
      xs: usable.map((_, i) => xOf(i)),
      ys: values.map(yOf),
      plotW,
      plotH,
      yMin,
      yMax,
      // Open-ended ranges run the band to the edge of the plot rather than
      // inventing the bound the report never printed.
      bandTop: band?.high != null ? yOf(Math.min(band.high, yMax)) : PAD.top,
      bandBottom:
        band?.low != null ? yOf(Math.max(band.low, yMin)) : PAD.top + plotH,
    };
  }, [points, band, width]);

  const summary = `${testName}: ${points.length} readings over time`;

  return (
    <div ref={wrapperRef} className="relative mt-3 w-full">
      {model && (
        <>
          <svg
            width={width}
            height={HEIGHT}
            role="img"
            aria-label={summary}
            className="block"
            onPointerLeave={() => setActive(null)}
            onPointerMove={(event) => {
              const box = event.currentTarget.getBoundingClientRect();
              const x = event.clientX - box.left;
              // Nearest point by x: the reader aims at a date, never at a
              // 2px line or an 8px dot.
              let nearest = 0;
              for (let i = 1; i < model.xs.length; i += 1) {
                if (Math.abs(model.xs[i] - x) < Math.abs(model.xs[nearest] - x)) {
                  nearest = i;
                }
              }
              setActive(nearest);
            }}
          >
            {/* Normal range, as a neutral wash. Deliberately not a status
                green: an abnormal row already sits on a red surface, and a
                green band inside it would read as a second, contradictory
                verdict. The label names it instead. */}
            {band && (
              <>
                <rect
                  x={PAD.left}
                  y={model.bandTop}
                  width={model.plotW}
                  height={Math.max(model.bandBottom - model.bandTop, 1)}
                  fill={GRID}
                  opacity={0.55}
                />
                <text
                  x={PAD.left + 4}
                  y={model.bandTop + 11}
                  fontSize={9}
                  fill={MUTED}
                >
                  normal range
                </text>
              </>
            )}

            {/* Baseline hairline, solid — never dashed. */}
            <line
              x1={PAD.left}
              y1={PAD.top + model.plotH}
              x2={PAD.left + model.plotW}
              y2={PAD.top + model.plotH}
              stroke={GRID}
              strokeWidth={1}
            />

            {/* y extremes only: with two to four readings a full grid is more
                ink than the data. */}
            {[model.yMax, model.yMin].map((v, i) => (
              <text
                key={`y-${i}`}
                x={PAD.left - 6}
                y={i === 0 ? PAD.top + 4 : PAD.top + model.plotH + 4}
                textAnchor="end"
                fontSize={10}
                fill={MUTED}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {Number(v.toFixed(v < 10 ? 1 : 0))}
              </text>
            ))}

            {active !== null && (
              <line
                x1={model.xs[active]}
                y1={PAD.top}
                x2={model.xs[active]}
                y2={PAD.top + model.plotH}
                stroke={MUTED}
                strokeWidth={1}
              />
            )}

            <path
              d={model.xs.map((x, i) => `${i ? "L" : "M"}${x},${model.ys[i]}`).join(" ")}
              fill="none"
              stroke={SERIES}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {model.usable.map((point, i) => {
              const flagged = ["high", "low"].includes(
                (point.flag || "").toLowerCase(),
              );
              return (
                <g key={`pt-${i}`}>
                  {/* 2px surface ring keeps the dot legible where it crosses
                      the line or the band edge. */}
                  <circle
                    cx={model.xs[i]}
                    cy={model.ys[i]}
                    r={4}
                    fill={flagged ? OUT_OF_RANGE : SERIES}
                    stroke={SURFACE}
                    strokeWidth={2}
                  />
                  {/* Hit and focus target, far larger than the 8px mark. */}
                  <circle
                    cx={model.xs[i]}
                    cy={model.ys[i]}
                    r={14}
                    fill="transparent"
                    tabIndex={0}
                    role="button"
                    aria-label={`${point.date ?? point.date_iso}: ${point.value} ${unit ?? ""}`}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                  />
                </g>
              );
            })}

            {/* No end-of-line value label here on purpose. The row header
                already shows the latest value at 16px directly above this
                chart, so repeating it on the last point is duplicate ink —
                and a long printed value ("> 100,000") would overflow the
                right padding trying to fit. */}

            {model.usable.map((point, i) => {
              const isFirst = i === 0;
              const isLast = i === model.usable.length - 1;
              // Only the ends when readings are crowded, so labels never
              // collide along the axis; only the last when the card is too
              // narrow to seat two dates without them touching.
              if (model.usable.length > 4 && !isFirst && !isLast) return null;
              if (model.plotW < 140 && !isLast) return null;
              return (
                <text
                  key={`x-${i}`}
                  x={model.xs[i]}
                  y={HEIGHT - 8}
                  textAnchor={isFirst ? "start" : isLast ? "end" : "middle"}
                  fontSize={10}
                  fill={MUTED}
                >
                  {point.date_iso ? shortDate(point.date_iso) : (point.date ?? "")}
                </text>
              );
            })}
          </svg>

          {active !== null && (
            <div
              className="pointer-events-none absolute z-10 rounded-md border border-slate-200 bg-white px-2 py-1 shadow-sm"
              style={{
                left: Math.min(Math.max(model.xs[active] - 40, 0), Math.max(width - 96, 0)),
                top: Math.max(model.ys[active] - 46, 0),
              }}
            >
              {/* Value leads, label follows: the reader already knows the
                  series and wants the number. */}
              <p className="text-xs font-semibold text-slate-900">
                {String(model.usable[active].value)}
                {unit ? ` ${unit}` : ""}
              </p>
              <p className="text-[10px] text-slate-500">
                {model.usable[active].date ?? model.usable[active].date_iso}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
