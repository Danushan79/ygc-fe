interface LabPoint {
  label: string;
  value: string;
  heightPercent: number;
  flagged: boolean;
}

const LAB_POINTS: LabPoint[] = [
  { label: "Jun 25", value: "6.5%", heightPercent: 30, flagged: false },
  { label: "Sep 25", value: "6.9%", heightPercent: 40, flagged: false },
  { label: "Mar 26", value: "7.3%", heightPercent: 60, flagged: false },
  { label: "Jul 26", value: "7.8%", heightPercent: 80, flagged: true },
];

export function LabTrendsCard() {
  return (
    <div className="flex h-48 flex-shrink-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
        <h3 className="text-sm font-semibold text-slate-900">Lab Trends</h3>
        <select
          disabled
          className="h-6 rounded border border-slate-200 bg-white p-0.5 text-[11px] text-slate-500"
          defaultValue="HbA1c"
        >
          <option>HbA1c</option>
        </select>
      </div>

      <div className="flex min-h-0 flex-1 gap-4 p-3">
        <div className="relative flex-1">
          <div className="absolute bottom-[20%] w-full border-t border-dashed border-green-500" />
          <span className="absolute right-0 bottom-[22%] bg-white/80 px-1 text-[10px] text-green-700">
            Normal Range
          </span>

          <div className="absolute inset-0 flex items-end justify-around px-2 pt-4 pb-6">
            {LAB_POINTS.map((point) => (
              <div
                key={point.label}
                className="relative flex w-4 flex-col items-center"
                style={{ height: `${point.heightPercent}%` }}
              >
                <span
                  className={`absolute -top-5 text-[10px] font-semibold ${point.flagged ? "text-red-600" : "text-slate-900"}`}
                >
                  {point.value}
                </span>
                <div
                  className={`z-10 h-2.5 w-2.5 rounded-full ${point.flagged ? "bg-red-600" : "bg-blue-800"}`}
                />
                <span className="absolute -bottom-5 text-[10px] whitespace-nowrap text-slate-500">
                  {point.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex w-48 flex-col justify-between rounded border border-slate-100 bg-slate-50 p-2 text-xs">
          <div>
            <p className="mb-1 text-[11px] font-semibold text-blue-800">Trend Note</p>
            <p className="text-[11px] leading-tight text-slate-900">
              HbA1c levels increasing over last 4 tests. Currently above normal range.
            </p>
          </div>
          <button
            type="button"
            className="mt-2 flex items-center gap-0.5 text-[11px] font-medium text-blue-800 hover:underline"
          >
            Discuss with doctor →
          </button>
        </div>
      </div>
    </div>
  );
}
