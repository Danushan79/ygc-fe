import { TriangleAlert } from "lucide-react";

interface Alert {
  title: string;
  description: string;
}

const ALERTS: Alert[] = [
  { title: "Drug Interaction", description: "Ibuprofen may reduce effect of Lisinopril." },
  { title: "Allergy Conflict", description: "Allergy to Penicillin recorded. Be cautious." },
];

export function SafetyAlertsCard() {
  return (
    <div className="flex-shrink-0 rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between rounded-t-lg border-b border-slate-200 bg-red-50 p-2.5">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
          <TriangleAlert className="h-4.5 w-4.5 text-red-600" strokeWidth={2} />
          Safety Alerts
        </h3>
        <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
          {ALERTS.length}
        </span>
      </div>

      <div className="space-y-2 p-2.5">
        {ALERTS.map((alert) => (
          <div key={alert.title} className="rounded border border-red-200 bg-red-50 p-2">
            <h4 className="mb-0.5 flex items-center gap-1 text-xs font-semibold text-red-700">
              <TriangleAlert className="h-3.5 w-3.5" strokeWidth={2} />
              {alert.title}
            </h4>
            <p className="text-[11px] leading-tight text-slate-900">{alert.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
