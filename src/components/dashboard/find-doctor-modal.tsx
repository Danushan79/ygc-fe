"use client";

import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Phone,
  Search,
  SearchX,
  Star,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FormBanner } from "@/components/auth/form-banner";
import { FormField } from "@/components/auth/form-field";
import { ApiRequestError, searchDoctorsRequest } from "@/lib/api/doctor-search-client";
import type { RecommendedSpecialty } from "@/types/document";
import type { DoctorSearchResult } from "@/types/doctor-search";

interface FindDoctorModalProps {
  open: boolean;
  onClose: () => void;
  consultType: string;
  typeLabel: string;
  specialties: RecommendedSpecialty[];
}

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const OPEN_STATUS_STYLES: Record<DoctorSearchResult["openStatus"], string> = {
  open: "bg-emerald-100 text-emerald-700",
  closed: "bg-red-100 text-red-700",
  unknown: "bg-slate-100 text-slate-500",
};

const OPEN_STATUS_LABELS: Record<DoctorSearchResult["openStatus"], string> = {
  open: "Likely open at your selected time",
  closed: "Likely closed at your selected time",
  unknown: "Hours not listed",
};

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatDisplayDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const DEFAULT_RADIUS_KM = 5;
const WIDE_RADIUS_KM = 20;

/** Builds the free-text search query sent to Places from the consult
 * recommendation. Pharmacist consults always search pharmacies only,
 * regardless of any recommended specialties — everything else searches by
 * specialty (when we have one) or a sensible default for the consult type. */
function buildSearchQuery(consultType: string, typeLabel: string, specialties: RecommendedSpecialty[]): string {
  if (consultType === "pharmacist") return "pharmacy";

  if (specialties.length > 0) {
    return `${specialties.map((s) => s.specialty).join(", ")} ${typeLabel}`;
  }
  if (consultType === "doctor") return "doctor clinic";
  return `${typeLabel} clinic`;
}

function DateCalendar({ selected, onSelect }: { selected: string; onSelect: (iso: string) => void }) {
  const todayIso = toIsoDate(new Date());
  const [viewMonth, setViewMonth] = useState(startOfMonth(selected ? new Date(`${selected}T00:00:00`) : new Date()));

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  return (
    <div className="w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setViewMonth(new Date(year, month - 1, 1))}
          className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-100"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        </button>
        <p className="text-xs font-semibold text-slate-900">
          {viewMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </p>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setViewMonth(new Date(year, month + 1, 1))}
          className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-100"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium text-slate-400">
        {WEEKDAY_LABELS.map((label, index) => (
          <span key={`${label}-${index}`} className="py-1">
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cellDate, index) => {
          if (!cellDate) return <span key={`empty-${index}`} />;

          const iso = toIsoDate(cellDate);
          const isPast = iso < todayIso;
          const isSelected = iso === selected;
          const isToday = iso === todayIso;

          return (
            <button
              key={iso}
              type="button"
              disabled={isPast}
              onClick={() => onSelect(iso)}
              className={`rounded-md py-1.5 text-xs transition-colors ${
                isSelected
                  ? "bg-blue-700 font-semibold text-white"
                  : isPast
                    ? "cursor-not-allowed text-slate-300"
                    : isToday
                      ? "font-semibold text-blue-700 hover:bg-blue-50"
                      : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {cellDate.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FindDoctorModal({ open, onClose, consultType, typeLabel, specialties }: FindDoctorModalProps) {
  const [step, setStep] = useState<"form" | "results">("form");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<DoctorSearchResult[] | null>(null);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const calendarRef = useRef<HTMLDivElement>(null);

  function handleClose() {
    if (isSearching) return;
    setStep("form");
    setLocation("");
    setDate("");
    setTime("");
    setIsCalendarOpen(false);
    setError(null);
    setResults(null);
    setRadiusKm(DEFAULT_RADIUS_KM);
    onClose();
  }

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!isCalendarOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCalendarOpen]);

  if (!open) return null;

  async function runSearch(searchRadiusKm: number) {
    if (!location.trim() || !date || !time || isSearching) return;

    setIsSearching(true);
    setError(null);
    try {
      const query = buildSearchQuery(consultType, typeLabel, specialties);
      const response = await searchDoctorsRequest({
        location: location.trim(),
        date,
        time,
        query,
        radiusKm: searchRadiusKm,
      });
      setRadiusKm(searchRadiusKm);
      setResults(response.results);
      setStep("results");
    } catch (err) {
      setResults(null);
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.");
      setStep("results");
    } finally {
      setIsSearching(false);
    }
  }

  function handleSearch() {
    return runSearch(DEFAULT_RADIUS_KM);
  }

  function handleSearchWider() {
    return runSearch(WIDE_RADIUS_KM);
  }

  function handleBackToSearch() {
    setStep("form");
    setError(null);
    setRadiusKm(DEFAULT_RADIUS_KM);
  }

  const canSearch = location.trim().length > 0 && Boolean(date) && Boolean(time);

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="find-doctor-modal-title"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 id="find-doctor-modal-title" className="text-base font-semibold text-slate-900">
            {step === "form" ? `Find a ${typeLabel}` : "Search Results"}
          </h3>
          <button
            type="button"
            aria-label="Close"
            onClick={handleClose}
            disabled={isSearching}
            className="rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          {step === "form" ? (
            <div className="space-y-4">
              <FormField
                id="find-doctor-location"
                label="Preferred location"
                placeholder="e.g. Colombo 07, or a full address"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                autoFocus
              />

              <div className="grid grid-cols-2 gap-3">
                <div ref={calendarRef} className="relative">
                  <label className="mb-2 block text-sm font-semibold text-slate-900">Preferred date</label>
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen((prev) => !prev)}
                    className="flex w-full items-center gap-2 rounded-lg border border-slate-300 px-4 py-3 text-left text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <CalendarDays className="h-4 w-4 flex-shrink-0 text-slate-400" strokeWidth={2} />
                    <span className={date ? "text-slate-900" : "text-slate-400"}>
                      {date ? formatDisplayDate(date) : "Select date"}
                    </span>
                  </button>
                  {isCalendarOpen && (
                    <div className="absolute top-full left-0 z-10 mt-1.5">
                      <DateCalendar
                        selected={date}
                        onSelect={(iso) => {
                          setDate(iso);
                          setIsCalendarOpen(false);
                        }}
                      />
                    </div>
                  )}
                </div>

                <FormField
                  id="find-doctor-time"
                  label="Preferred time"
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                />
              </div>

              {error && <FormBanner tone="error">{error}</FormBanner>}
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleBackToSearch}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800"
              >
                <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
                Back to search
              </button>

              {error ? (
                <FormBanner tone="error">{error}</FormBanner>
              ) : results && results.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-10 text-slate-400">
                  <SearchX className="h-8 w-8" strokeWidth={1.5} />
                  <p className="text-center text-sm">
                    No {typeLabel.toLowerCase()}s found within {radiusKm}km of that location.
                  </p>
                  <div className="flex flex-col items-center gap-2 sm:flex-row">
                    {radiusKm < WIDE_RADIUS_KM && (
                      <button
                        type="button"
                        onClick={handleSearchWider}
                        disabled={isSearching}
                        className="flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSearching ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                        ) : (
                          <Search className="h-3.5 w-3.5" strokeWidth={2} />
                        )}
                        Search within {WIDE_RADIUS_KM}km instead
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleBackToSearch}
                      disabled={isSearching}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Choose a different location
                    </button>
                  </div>
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {results?.map((result) => (
                    <li key={result.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{result.name}</p>
                          {result.specialty && (
                            <p className="text-xs text-slate-500">{result.specialty}</p>
                          )}
                        </div>
                        <span
                          className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${OPEN_STATUS_STYLES[result.openStatus]}`}
                        >
                          {OPEN_STATUS_LABELS[result.openStatus]}
                        </span>
                      </div>

                      <p className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-600">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400" strokeWidth={2} />
                        <span>{result.address}</span>
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                        <span className="font-medium text-slate-700">{result.distanceKm} km away</span>
                        {result.rating !== null && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" strokeWidth={2} />
                            {result.rating}
                            {result.ratingCount !== null && (
                              <span className="text-slate-400">({result.ratingCount})</span>
                            )}
                          </span>
                        )}
                        {result.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 text-slate-400" strokeWidth={2} />
                            {result.phone}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {step === "form" && (
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 p-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSearching}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-blue-800 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSearch}
              disabled={!canSearch || isSearching}
              className="flex items-center gap-2 rounded-lg bg-blue-700 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" strokeWidth={2} />
                  Search
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
