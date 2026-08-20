"use client";

import { FileSearch, FileText, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { DocumentVisit } from "@/types/document";
import { formatDisplayDate, toSortableTime } from "@/utils/date";
import { formatDocumentType, iconForDocumentType } from "@/utils/document-type";

interface DocumentsLibraryProps {
  visits: DocumentVisit[];
}

function confidenceBadge(confidence: number): { label: string; className: string } {
  if (confidence >= 0.85) {
    return { label: "High confidence", className: "bg-green-100 text-green-700" };
  }
  if (confidence >= 0.7) {
    return { label: "Review suggested", className: "bg-amber-100 text-amber-700" };
  }
  return { label: "Low confidence", className: "bg-red-100 text-red-700" };
}

/** Local calendar day (YYYY-MM-DD) an ISO uploaded_at timestamp falls on,
 * for comparing against a <input type="date"> value. */
function uploadedDateKey(uploadedAt: string): string {
  const parsed = new Date(uploadedAt);
  if (Number.isNaN(parsed.getTime())) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DocumentsLibrary({ visits }: DocumentsLibraryProps) {
  const [search, setSearch] = useState("");
  const [uploadedFrom, setUploadedFrom] = useState("");
  const [uploadedTo, setUploadedTo] = useState("");

  const sorted = useMemo(
    () => [...visits].sort((a, b) => toSortableTime(b.date) - toSortableTime(a.date)),
    [visits],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sorted.filter((visit) => {
      if (query) {
        const matchesQuery = [visit.document_type, visit.provider_or_doctor, visit.patient_name, visit.date]
          .filter((field): field is string => Boolean(field))
          .some((field) => field.toLowerCase().includes(query));
        if (!matchesQuery) return false;
      }

      if (uploadedFrom || uploadedTo) {
        // No uploaded_at on record (saved before the field existed) — can't
        // place it in the range, so it drops out while a date filter is set.
        if (!visit.uploaded_at) return false;
        const uploadedKey = uploadedDateKey(visit.uploaded_at);
        if (!uploadedKey) return false;
        if (uploadedFrom && uploadedKey < uploadedFrom) return false;
        if (uploadedTo && uploadedKey > uploadedTo) return false;
      }

      return true;
    });
  }, [sorted, search, uploadedFrom, uploadedTo]);

  const hasUploadedDateFilter = Boolean(uploadedFrom || uploadedTo);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex flex-shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Documents</h2>
          <p className="mt-1 text-sm text-slate-500">
            {visits.length} document{visits.length === 1 ? "" : "s"} uploaded so far.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              strokeWidth={2}
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by type, provider, or date"
              className="w-full rounded-xl border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 transition-shadow focus:border-transparent focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <label className="flex items-center gap-1.5 text-xs text-slate-500">
              Uploaded
              <input
                type="date"
                value={uploadedFrom}
                onChange={(event) => setUploadedFrom(event.target.value)}
                max={uploadedTo || undefined}
                aria-label="Uploaded from date"
                className="rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 transition-shadow focus:border-transparent focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </label>
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={uploadedTo}
              onChange={(event) => setUploadedTo(event.target.value)}
              min={uploadedFrom || undefined}
              aria-label="Uploaded to date"
              className="rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 transition-shadow focus:border-transparent focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
            {hasUploadedDateFilter && (
              <button
                type="button"
                onClick={() => {
                  setUploadedFrom("");
                  setUploadedTo("");
                }}
                className="text-xs font-medium text-blue-800 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-1">
        {visits.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white/60 text-center">
            <FileSearch className="h-10 w-10 text-slate-300" strokeWidth={1.5} />
            <p className="text-sm font-medium text-slate-500">No documents yet</p>
            <p className="text-xs text-slate-400">Upload a medical record to see it here.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white/60 text-center">
            <Search className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
            <p className="text-sm font-medium text-slate-500">
              {search
                ? `No documents match "${search}"`
                : "No documents were uploaded in that date range"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((visit, index) => {
              const Icon = iconForDocumentType(visit.document_type);
              const confidence = confidenceBadge(visit.overall_confidence);
              const medicationCount = visit.medications.length;
              const labResultCount = visit.lab_results.length;

              return (
                <div
                  key={`${visit.cloudinary_public_id}-${index}`}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.02] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700">
                        <Icon className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {formatDocumentType(visit.document_type)}
                        </p>
                        <p className="text-xs text-slate-500">{visit.date}</p>
                        {visit.uploaded_at && (
                          <p className="text-[11px] text-slate-400">
                            Uploaded {formatDisplayDate(visit.uploaded_at)}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="mt-3 truncate text-xs text-slate-500">
                      {visit.provider_or_doctor ?? "Unknown provider"}
                    </p>

                    {visit.clinical_notes && (
                      <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                        {visit.clinical_notes}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${confidence.className}`}
                      >
                        {confidence.label}
                      </span>
                      {medicationCount > 0 && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {medicationCount} medication{medicationCount === 1 ? "" : "s"}
                        </span>
                      )}
                      {labResultCount > 0 && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {labResultCount} lab result{labResultCount === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                  </div>

                  <a
                    href={visit.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-medium text-blue-800 transition-colors hover:border-blue-200 hover:bg-blue-50"
                  >
                    <FileText className="h-3.5 w-3.5" strokeWidth={2} />
                    View original
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
