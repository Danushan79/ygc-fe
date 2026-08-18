import { CircleCheck, FileWarning, Pill, Search, Stethoscope, UserRound } from "lucide-react";
import type { ConsultAction, ConsultTriage } from "@/types/document";

interface DoctorRecommendationCardProps {
  consultTriage?: ConsultTriage;
}

const URGENCY_STYLES: Record<string, string> = {
  routine: "bg-blue-100 text-blue-700",
  soon: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
};

const TYPE_ICONS: Record<string, typeof Stethoscope> = {
  pharmacist: Pill,
  doctor: Stethoscope,
  specialist: UserRound,
};

function titleCase(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Documents that scanned badly. Shown quietly and worded as what it is —
 * a note about the paperwork, not a reason to go and see anyone. Rendering
 * this as a referral is what made a clean prescription say "speak to a
 * pharmacist". */
function DocumentQualityNotice({
  notices,
  note,
}: {
  notices: ConsultAction[];
  note?: string | null;
}) {
  if (notices.length === 0) return null;

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
        <FileWarning className="h-3.5 w-3.5 text-slate-500" strokeWidth={2} />
        Document quality
      </p>
      <p className="mt-1 text-[10px] leading-snug text-slate-500">
        {note ??
          `${notices.length} document(s) could not be read with full confidence.`}
      </p>
      <ul className="mt-1.5 space-y-1">
        {notices.map((notice, index) => (
          <li key={index} className="truncate text-[10px] text-slate-500">
            {notice.subject ?? titleCase(notice.trigger)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DoctorRecommendationCard({ consultTriage }: DoctorRecommendationCardProps) {
  const qualityNotices = consultTriage?.document_quality_notices ?? [];

  if (!consultTriage || !consultTriage.consult_needed) {
    return (
      <div className="flex-shrink-0 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-1.5 rounded-t-lg border-b border-slate-200 bg-slate-50 px-3 py-2">
          <Stethoscope className="h-4.5 w-4.5 text-slate-500" strokeWidth={2} />
          <h3 className="text-sm font-semibold text-slate-900">Doctor Recommendation</h3>
        </div>
        <div className="flex flex-col items-center justify-center gap-1.5 p-6 text-slate-400">
          <CircleCheck className="h-6 w-6" strokeWidth={1.5} />
          <p className="text-xs">No consult needed based on the current documents</p>
        </div>
        {qualityNotices.length > 0 && (
          <div className="border-t border-slate-100 p-3 pt-2.5">
            <DocumentQualityNotice
              notices={qualityNotices}
              note={consultTriage?.document_quality_note}
            />
          </div>
        )}
      </div>
    );
  }

  const {
    consult_type,
    urgency,
    urgency_meaning,
    recommended_specialties,
    referral_items,
    summary,
    emergency_advice,
  } = consultTriage;

  const typeLabel = titleCase(consult_type);
  const TypeIcon = TYPE_ICONS[consult_type] ?? Stethoscope;

  return (
    <div className="flex-shrink-0 rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between rounded-t-lg border-b border-slate-200 bg-blue-50 px-3 py-2">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
          <Stethoscope className="h-4.5 w-4.5 text-blue-700" strokeWidth={2} />
          Doctor Recommendation
        </h3>
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
            URGENCY_STYLES[urgency] ?? "bg-slate-100 text-slate-600"
          }`}
        >
          {titleCase(urgency)}
        </span>
      </div>

      <div className="space-y-3 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 p-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <TypeIcon className="h-4.5 w-4.5" strokeWidth={2} />
            </span>
            <div>
              <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">Consult type</p>
              <p className="text-sm font-semibold text-slate-900">{typeLabel}</p>
            </div>
          </div>

          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md border border-blue-700 bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-800"
          >
            <Search className="h-3.5 w-3.5" strokeWidth={2} />
            Find a {typeLabel}
          </button>
        </div>

        <p className="text-xs leading-relaxed text-slate-700">{summary}</p>

        <p className="text-[11px] text-slate-500">
          <span className="font-medium text-slate-600">Suggested timing: </span>
          {urgency_meaning}
        </p>

        {recommended_specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {recommended_specialties.map((specialty) => (
              <span
                key={specialty.specialty}
                title={specialty.reason}
                className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700"
              >
                {specialty.specialty}
              </span>
            ))}
          </div>
        )}

        {referral_items.length > 0 && (
          <div>
            <p className="mb-1 text-[10px] font-medium tracking-wide text-slate-500 uppercase">
              Issues to discuss
            </p>
            <ul className="space-y-1">
              {referral_items.map((item, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between gap-2 rounded-md border border-slate-100 bg-slate-50 px-2 py-1.5"
                >
                  <span className="text-[11px] font-medium text-slate-800">{titleCase(item.trigger)}</span>
                  {item.subject && (
                    <span className="truncate text-[10px] text-slate-500">{item.subject}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <DocumentQualityNotice
          notices={qualityNotices}
          note={consultTriage.document_quality_note}
        />

        <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-[10px] leading-snug text-amber-800">
          {emergency_advice}
        </p>
      </div>
    </div>
  );
}
