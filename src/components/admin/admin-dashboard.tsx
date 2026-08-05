"use client";

import {
  CheckCircle2,
  FileText,
  Loader2,
  ShieldAlert,
  TriangleAlert,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getDashboardOverviewRequest } from "@/lib/api/admin-client";
import { ApiRequestError } from "@/lib/api/http-client";
import type { AdminDashboardOverviewDto, AdminDashboardSafetyAlert } from "@/types/admin";

// Categorical slots 1 & 2 and the fixed status steps from the design system's
// validated palette — the only place this page reaches for raw color, since
// these are the marks that carry data meaning (bars, badges).
const SERIES_BLUE = "#2a78d6";
const SERIES_ORANGE = "#eb6834";
const STATUS_GOOD = "#0ca30c";
const STATUS_WARNING = "#fab219";
const STATUS_CRITICAL = "#d03b3b";

function formatDayLabel(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

type Tone = "neutral" | "good" | "warning" | "critical";

function toneColor(tone: Tone): string {
  if (tone === "good") return STATUS_GOOD;
  if (tone === "warning") return STATUS_WARNING;
  if (tone === "critical") return STATUS_CRITICAL;
  return "#898781";
}

function StatTile({
  icon: Icon,
  label,
  value,
  subtext,
  tone = "neutral",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  subtext?: string;
  tone?: Tone;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Icon className="h-4 w-4" style={{ color: toneColor(tone) }} strokeWidth={2} />
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
    </div>
  );
}

function ChartCard({
  title,
  isTableView,
  onToggle,
  children,
}: {
  title: string;
  isTableView: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <button
          type="button"
          onClick={onToggle}
          className="text-xs font-medium text-blue-700 hover:underline"
        >
          {isTableView ? "Show chart" : "Show table"}
        </button>
      </div>
      {children}
    </div>
  );
}

function DocumentTypeChart({ data }: { data: AdminDashboardOverviewDto["documentTypeBreakdown"] }) {
  const [isTableView, setIsTableView] = useState(false);
  const total = data.reduce((sum, entry) => sum + entry.count, 0);
  const colors = [SERIES_BLUE, SERIES_ORANGE];

  return (
    <ChartCard
      title="Documents by type"
      isTableView={isTableView}
      onToggle={() => setIsTableView((value) => !value)}
    >
      {total === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No documents processed yet.</p>
      ) : isTableView ? (
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-slate-500 uppercase">
              <th className="py-1 font-semibold">Type</th>
              <th className="py-1 font-semibold">Count</th>
              <th className="py-1 font-semibold">Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((entry, index) => (
              <tr key={entry.documentType}>
                <td className="py-1.5 text-slate-700">
                  <span
                    className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  {entry.documentType.replace(/_/g, " ")}
                </td>
                <td className="py-1.5 text-slate-700">{entry.count}</td>
                <td className="py-1.5 text-slate-700">{((entry.count / total) * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <>
          <div className="mt-4 flex h-6 w-full">
            {data.map((entry, index) => (
              <div
                key={entry.documentType}
                tabIndex={0}
                className="group relative h-full first:rounded-l-full last:rounded-r-full focus:outline-none"
                style={{
                  width: `${(entry.count / total) * 100}%`,
                  backgroundColor: colors[index % colors.length],
                  marginRight: index < data.length - 1 ? 2 : 0,
                }}
              >
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 rounded-lg bg-slate-900 px-2 py-1 text-xs whitespace-nowrap text-white group-hover:block group-focus:block">
                  <span className="font-semibold">{entry.count}</span> {entry.documentType.replace(/_/g, " ")}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {data.map((entry, index) => (
              <div key={entry.documentType} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                {entry.documentType.replace(/_/g, " ")} &middot; {entry.count}
              </div>
            ))}
          </div>
        </>
      )}
    </ChartCard>
  );
}

function UploadsChart({ data }: { data: AdminDashboardOverviewDto["uploadsByDay"] }) {
  const [isTableView, setIsTableView] = useState(false);
  const max = Math.max(1, ...data.map((entry) => entry.count));

  return (
    <ChartCard
      title="Uploads, last 7 days"
      isTableView={isTableView}
      onToggle={() => setIsTableView((value) => !value)}
    >
      {isTableView ? (
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-slate-500 uppercase">
              <th className="py-1 font-semibold">Date</th>
              <th className="py-1 font-semibold">Uploads</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((entry) => (
              <tr key={entry.date}>
                <td className="py-1.5 text-slate-700">{formatDayLabel(entry.date)}</td>
                <td className="py-1.5 text-slate-700">{entry.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <>
          <div className="mt-6 flex h-32 gap-1.5">
            {data.map((entry) => (
              <div key={entry.date} className="flex h-full flex-1 flex-col items-center justify-end">
                <div
                  tabIndex={0}
                  className="group relative w-full max-w-[22px] rounded-t-[4px] transition-opacity hover:opacity-80 focus:opacity-80 focus:outline-none"
                  style={{
                    height: `${Math.max(3, (entry.count / max) * 100)}%`,
                    backgroundColor: SERIES_BLUE,
                  }}
                >
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 rounded-lg bg-slate-900 px-2 py-1 text-xs whitespace-nowrap text-white group-hover:block group-focus:block">
                    <span className="font-semibold">{entry.count}</span> upload{entry.count === 1 ? "" : "s"} &middot;{" "}
                    {formatDayLabel(entry.date)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex gap-1.5">
            {data.map((entry) => (
              <div key={entry.date} className="flex-1 text-center text-[10px] text-slate-400">
                {formatDayLabel(entry.date)}
              </div>
            ))}
          </div>
        </>
      )}
    </ChartCard>
  );
}

function FlagBadge({ count, tone }: { count: number; tone: "critical" | "warning" }) {
  if (count === 0) {
    return <span className="text-slate-400">0</span>;
  }
  const color = tone === "critical" ? STATUS_CRITICAL : STATUS_WARNING;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: `${color}1A`, color }}
    >
      <TriangleAlert className="h-3 w-3" strokeWidth={2.5} />
      {count}
    </span>
  );
}

function SafetyAlertsTable({ alerts }: { alerts: AdminDashboardSafetyAlert[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-900">Patients with cross-check flags</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Drug interactions, duplicate prescriptions, dosage conflicts, and allergy conflicts found
          across each patient&apos;s merged timeline.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
              <th className="px-4 py-3 font-semibold">Patient</th>
              <th className="px-4 py-3 font-semibold">Drug interactions</th>
              <th className="px-4 py-3 font-semibold">Duplicate prescriptions</th>
              <th className="px-4 py-3 font-semibold">Dosage conflicts</th>
              <th className="px-4 py-3 font-semibold">Allergy conflicts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {alerts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No safety flags detected across any patient timeline.
                </td>
              </tr>
            ) : (
              alerts.map((alert) => (
                <tr key={alert.userId} className="text-slate-700">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{alert.fullName}</div>
                    <div className="text-xs text-slate-500">{alert.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <FlagBadge count={alert.drugInteractions} tone="critical" />
                  </td>
                  <td className="px-4 py-3">
                    <FlagBadge count={alert.duplicatePrescriptions} tone="warning" />
                  </td>
                  <td className="px-4 py-3">
                    <FlagBadge count={alert.conflictingDosage} tone="warning" />
                  </td>
                  <td className="px-4 py-3">
                    <FlagBadge count={alert.allergyConflicts} tone="critical" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardOverviewDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getDashboardOverviewRequest()
      .then((result) => {
        if (!cancelled) {
          setData(result);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError instanceof ApiRequestError
              ? requestError.message
              : "Something went wrong. Please try again.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" strokeWidth={2} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
        {error ?? "Something went wrong. Please try again."}
      </p>
    );
  }

  const confidenceTone: Tone =
    data.avgConfidence === null ? "neutral" : data.avgConfidence < 0.8 ? "warning" : "good";
  const alertsTone: Tone =
    data.totalSafetyFlags === 0 ? "good" : data.totalSafetyFlags >= 5 ? "critical" : "warning";

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile
          icon={Users}
          label="Total patients"
          value={String(data.totalPatients)}
          subtext={`${data.activePatients} active`}
        />
        <StatTile
          icon={UserPlus}
          label="New signups"
          value={String(data.newSignups7d)}
          subtext="Last 7 days"
        />
        <StatTile
          icon={FileText}
          label="Documents stored"
          value={String(data.totalDocuments)}
          subtext="Files in Cloudinary"
        />
        <StatTile
          icon={CheckCircle2}
          label="Avg. extraction confidence"
          value={data.avgConfidence === null ? "—" : `${Math.round(data.avgConfidence * 100)}%`}
          subtext={`${data.lowConfidenceDocumentCount} document${data.lowConfidenceDocumentCount === 1 ? "" : "s"} need review`}
          tone={confidenceTone}
        />
        <StatTile
          icon={ShieldAlert}
          label="Safety flags"
          value={String(data.totalSafetyFlags)}
          subtext={`${data.safetyAlerts.length} patient${data.safetyAlerts.length === 1 ? "" : "s"} affected`}
          tone={alertsTone}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DocumentTypeChart data={data.documentTypeBreakdown} />
        <UploadsChart data={data.uploadsByDay} />
      </div>

      <SafetyAlertsTable alerts={data.safetyAlerts} />
    </div>
  );
}
