"use client";

import { ArrowUp, Check, FileText, FlaskConical, ListFilter, Pill } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DocumentVisit } from "@/types/document";
import { toSortableTime } from "@/utils/date";
import { formatDocumentType, iconForDocumentType } from "@/utils/document-type";
import { formatLabResult } from "@/utils/lab-result";

interface HealthTimelineCardProps {
  visits: DocumentVisit[];
}

export function HealthTimelineCard({ visits }: HealthTimelineCardProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const filterRef = useRef<HTMLDivElement>(null);

  const documentTypes = useMemo(
    () => Array.from(new Set(visits.map((visit) => visit.document_type))).sort(),
    [visits],
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleType(type: string) {
    setSelectedTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  }

  const filteredVisits =
    selectedTypes.length === 0 ? visits : visits.filter((visit) => selectedTypes.includes(visit.document_type));
  const sortedVisits = [...filteredVisits].sort((a, b) => toSortableTime(b.date) - toSortableTime(a.date));

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 p-3">
        <h3 className="text-base font-semibold text-slate-900">Your Health Timeline</h3>
        <div ref={filterRef} className="relative">
          <button
            type="button"
            onClick={() => setIsFilterOpen((open) => !open)}
            className={`flex items-center gap-1 rounded border px-2 py-1 text-xs transition-colors ${
              selectedTypes.length > 0
                ? "border-blue-800 bg-blue-50 text-blue-800"
                : "border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <ListFilter className="h-3.5 w-3.5" strokeWidth={2} />
            Filter
            {selectedTypes.length > 0 && (
              <span className="ml-0.5 rounded-full bg-blue-800 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {selectedTypes.length}
              </span>
            )}
          </button>

          {isFilterOpen && (
            <div className="absolute top-full right-0 z-20 mt-1 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
              {documentTypes.length === 0 ? (
                <p className="p-2 text-xs text-slate-500">No document types yet.</p>
              ) : (
                <>
                  <div className="mb-1 flex items-center justify-between px-1">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">Document Type</span>
                    {selectedTypes.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedTypes([])}
                        className="text-[11px] font-medium text-blue-800 hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {documentTypes.map((type) => {
                      const isSelected = selectedTypes.includes(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => toggleType(type)}
                          className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-100"
                        >
                          {formatDocumentType(type)}
                          {isSelected && <Check className="h-3.5 w-3.5 text-blue-800" strokeWidth={2.5} />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="relative flex-1 overflow-y-auto p-4 pl-6">
        {sortedVisits.length === 0 ? (
          <p className="p-2 text-sm text-slate-500">
            {visits.length === 0
              ? "No visits recorded yet. Upload a document to get started."
              : "No visits match the selected filters."}
          </p>
        ) : (
          <>
            <div className="absolute top-4 bottom-0 left-[27px] w-px bg-slate-200" />

            <div className="space-y-6">
              {sortedVisits.map((visit, index) => {
                const Icon = iconForDocumentType(visit.document_type);
                return (
                  <div key={`${visit.cloudinary_public_id}-${index}`} className="relative pl-8">
                    <div className="absolute top-0 -left-0.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-blue-800 text-white ring-4 ring-white">
                      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                      <div className="mb-2 flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-blue-800">{visit.date}</h4>
                          <p className="text-xs font-semibold text-slate-900">
                            {formatDocumentType(visit.document_type)}{" "}
                            <span className="font-normal text-slate-500">
                              • {visit.provider_or_doctor ?? "Unknown provider"}
                            </span>
                          </p>
                        </div>
                        {index === 0 && (
                          <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-800 uppercase">
                            New
                          </span>
                        )}
                      </div>

                      <div className="space-y-3">
                        {visit.medications.length > 0 && (
                          <div className="flex gap-2">
                            <Pill className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" strokeWidth={2} />
                            <div className="w-full space-y-1">
                              <p className="text-xs text-slate-900">Medications</p>
                              {visit.medications.map((medication, medIndex) => (
                                <div key={`${medication.name}-${medIndex}`}>
                                  <p className="text-sm text-slate-900">{medication.name}</p>
                                  <p className="text-[11px] text-slate-500">
                                    {[medication.dosage, medication.frequency, medication.duration]
                                      .filter(Boolean)
                                      .join(" • ") || "No dosage details"}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {visit.lab_results.length > 0 && (
                          <div className="flex gap-2">
                            <FlaskConical className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-800" strokeWidth={2} />
                            <div className="w-full space-y-1.5">
                              <p className="text-xs text-slate-900">Lab Results</p>
                              {visit.lab_results.map((rawResult, resultIndex) => {
                                const result = formatLabResult(rawResult);
                                return (
                                  <div
                                    key={`${result.label}-${resultIndex}`}
                                    className={`flex items-center justify-between rounded border p-1.5 ${
                                      result.flagged
                                        ? "border-red-100 bg-red-50"
                                        : "border-slate-100 bg-slate-50"
                                    }`}
                                  >
                                    <span className="text-xs text-slate-900">{result.label}</span>
                                    <span
                                      className={`flex items-center gap-1 text-sm font-semibold ${
                                        result.flagged ? "text-red-600" : "text-slate-900"
                                      }`}
                                    >
                                      {result.value}
                                      {result.flagged && <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.5} />}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2">
                        <p className="text-[11px] text-slate-500">{visit.clinical_notes ?? ""}</p>
                        <a
                          href={visit.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-shrink-0 items-center gap-1 text-[11px] font-medium text-blue-800 hover:underline"
                        >
                          View Document
                          <FileText className="h-3.5 w-3.5" strokeWidth={2} />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
