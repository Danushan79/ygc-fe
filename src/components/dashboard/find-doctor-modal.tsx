"use client";

import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  Phone,
  Search,
  SearchX,
  Star,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = ["00", "15", "30", "45"];

interface ParsedTime {
  hour12: number;
  minute: string;
  meridiem: "AM" | "PM";
}

function parseTime(value: string): ParsedTime | null {
  if (!value) return null;
  const [hStr, minute] = value.split(":");
  const hour24 = Number(hStr);
  if (Number.isNaN(hour24)) return null;
  const meridiem: "AM" | "PM" = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { hour12, minute, meridiem };
}

function buildTime(hour12: number, minute: string, meridiem: "AM" | "PM"): string {
  const hour24 = meridiem === "PM" ? (hour12 % 12) + 12 : hour12 % 12;
  return `${String(hour24).padStart(2, "0")}:${minute}`;
}

function formatDisplayTime(value: string): string {
  const parsed = parseTime(value);
  if (!parsed) return "";
  return `${parsed.hour12}:${parsed.minute} ${parsed.meridiem}`;
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
    <div className="w-72 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-2xl ring-1 ring-black/5">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setViewMonth(new Date(year, month - 1, 1))}
          className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        </button>
        <p className="text-sm font-semibold text-slate-900">
          {viewMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </p>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setViewMonth(new Date(year, month + 1, 1))}
          className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
        {WEEKDAY_LABELS.map((label, index) => (
          <span key={`${label}-${index}`} className="py-1">
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
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
              className={`rounded-lg py-1.5 text-xs transition-all ${
                isSelected
                  ? "bg-gradient-to-br from-blue-600 to-blue-700 font-semibold text-white shadow-md shadow-blue-600/30"
                  : isPast
                    ? "cursor-not-allowed text-slate-300"
                    : isToday
                      ? "font-semibold text-blue-700 ring-1 ring-inset ring-blue-200 hover:bg-blue-50"
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

interface PopoverCoords {
  left: number;
  width: number;
  placement: "top" | "bottom";
  anchorTop: number;
  anchorBottom: number;
}

const POPOVER_WIDTH = 288;
const DATE_POPOVER_HEIGHT = 340;
const TIME_POPOVER_HEIGHT = 300;
const VIEWPORT_MARGIN = 16;
const ANCHOR_GAP = 8;

/** Positions a field's popover as a fixed-coordinate portal anchored to its
 * trigger button, so it floats above the page instead of being clipped by
 * the modal's scrolling container — and flips above the field when there
 * isn't room below. */
function useFieldPopover(isOpen: boolean, onRequestClose: () => void, estimatedHeight: number) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<PopoverCoords | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const placement: "top" | "bottom" =
        spaceBelow < estimatedHeight && rect.top > spaceBelow ? "top" : "bottom";

      let left = rect.left;
      if (left + POPOVER_WIDTH > viewportWidth - VIEWPORT_MARGIN) {
        left = viewportWidth - POPOVER_WIDTH - VIEWPORT_MARGIN;
      }
      if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN;

      setCoords({ left, width: POPOVER_WIDTH, placement, anchorTop: rect.top, anchorBottom: rect.bottom });
    }

    updatePosition();
    const raf = requestAnimationFrame(() => setIsVisible(true));
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      setIsVisible(false);
    };
  }, [isOpen, estimatedHeight]);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      onRequestClose();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onRequestClose();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onRequestClose]);

  return { buttonRef, popoverRef, coords, isVisible };
}

function FieldPopover({
  coords,
  isVisible,
  popoverRef,
  children,
}: {
  coords: PopoverCoords | null;
  isVisible: boolean;
  popoverRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}) {
  if (!coords) return null;

  return createPortal(
    <div
      ref={popoverRef}
      style={{
        position: "fixed",
        left: coords.left,
        width: coords.width,
        ...(coords.placement === "bottom"
          ? { top: coords.anchorBottom + ANCHOR_GAP }
          : { bottom: window.innerHeight - coords.anchorTop + ANCHOR_GAP }),
        transformOrigin: coords.placement === "bottom" ? "top left" : "bottom left",
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? "translateY(0) scale(1)"
          : `translateY(${coords.placement === "bottom" ? "-4px" : "4px"}) scale(0.97)`,
      }}
      className="z-[100] transition-all duration-150 ease-out"
    >
      {children}
    </div>,
    document.body,
  );
}

function DatePickerField({ date, onSelect }: { date: string; onSelect: (iso: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);
  const { buttonRef, popoverRef, coords, isVisible } = useFieldPopover(isOpen, close, DATE_POPOVER_HEIGHT);

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-900">Preferred date</label>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex w-full items-center gap-2 rounded-lg border bg-white px-4 py-3 text-left text-sm text-slate-900 transition-colors focus:ring-2 focus:ring-blue-600 focus:outline-none ${
          isOpen ? "border-blue-600 ring-2 ring-blue-600" : "border-slate-300 hover:border-slate-400"
        }`}
      >
        <CalendarDays className="h-4 w-4 flex-shrink-0 text-slate-400" strokeWidth={2} />
        <span className={date ? "text-slate-900" : "text-slate-400"}>
          {date ? formatDisplayDate(date) : "Select date"}
        </span>
      </button>

      {isOpen && (
        <FieldPopover coords={coords} isVisible={isVisible} popoverRef={popoverRef}>
          <DateCalendar
            selected={date}
            onSelect={(iso) => {
              onSelect(iso);
              setIsOpen(false);
            }}
          />
        </FieldPopover>
      )}
    </div>
  );
}

function TimePicker({
  value,
  onChange,
  onDone,
}: {
  value: string;
  onChange: (value: string) => void;
  onDone: () => void;
}) {
  const parsed = parseTime(value);

  function selectHour(hour12: number) {
    onChange(buildTime(hour12, parsed?.minute ?? "00", parsed?.meridiem ?? "AM"));
  }

  function selectMinute(minute: string) {
    onChange(buildTime(parsed?.hour12 ?? 9, minute, parsed?.meridiem ?? "AM"));
  }

  function selectMeridiem(meridiem: "AM" | "PM") {
    onChange(buildTime(parsed?.hour12 ?? 9, parsed?.minute ?? "00", meridiem));
  }

  return (
    <div className="w-72 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-2xl ring-1 ring-black/5">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
        <Clock className="h-4 w-4 text-blue-700" strokeWidth={2} />
        {value ? formatDisplayTime(value) : "Select a time"}
      </p>

      <div className="flex gap-2">
        <div className="flex-1">
          <p className="mb-1 text-center text-[10px] font-semibold tracking-wide text-slate-400 uppercase">Hour</p>
          <div className="flex max-h-48 flex-col gap-1 overflow-y-auto pr-0.5">
            {HOURS_12.map((hour12) => (
              <button
                key={hour12}
                type="button"
                onClick={() => selectHour(hour12)}
                className={`rounded-lg py-1.5 text-sm transition-colors ${
                  parsed?.hour12 === hour12
                    ? "bg-gradient-to-br from-blue-600 to-blue-700 font-semibold text-white shadow-md shadow-blue-600/30"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {hour12}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <p className="mb-1 text-center text-[10px] font-semibold tracking-wide text-slate-400 uppercase">Min</p>
          <div className="flex flex-col gap-1">
            {MINUTES.map((minute) => (
              <button
                key={minute}
                type="button"
                onClick={() => selectMinute(minute)}
                className={`rounded-lg py-1.5 text-sm transition-colors ${
                  parsed?.minute === minute
                    ? "bg-gradient-to-br from-blue-600 to-blue-700 font-semibold text-white shadow-md shadow-blue-600/30"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {minute}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <p className="mb-1 text-center text-[10px] font-semibold tracking-wide text-slate-400 uppercase">Period</p>
          <div className="flex flex-col gap-1">
            {(["AM", "PM"] as const).map((meridiem) => (
              <button
                key={meridiem}
                type="button"
                onClick={() => selectMeridiem(meridiem)}
                className={`rounded-lg py-1.5 text-sm font-semibold transition-colors ${
                  parsed?.meridiem === meridiem
                    ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {meridiem}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="mt-3 w-full rounded-lg bg-blue-50 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
      >
        Done
      </button>
    </div>
  );
}

function TimePickerField({ time, onSelect }: { time: string; onSelect: (value: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);
  const { buttonRef, popoverRef, coords, isVisible } = useFieldPopover(isOpen, close, TIME_POPOVER_HEIGHT);

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-900">Preferred time</label>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex w-full items-center gap-2 rounded-lg border bg-white px-4 py-3 text-left text-sm text-slate-900 transition-colors focus:ring-2 focus:ring-blue-600 focus:outline-none ${
          isOpen ? "border-blue-600 ring-2 ring-blue-600" : "border-slate-300 hover:border-slate-400"
        }`}
      >
        <Clock className="h-4 w-4 flex-shrink-0 text-slate-400" strokeWidth={2} />
        <span className={time ? "text-slate-900" : "text-slate-400"}>
          {time ? formatDisplayTime(time) : "Select time"}
        </span>
      </button>

      {isOpen && (
        <FieldPopover coords={coords} isVisible={isVisible} popoverRef={popoverRef}>
          <TimePicker value={time} onChange={onSelect} onDone={() => setIsOpen(false)} />
        </FieldPopover>
      )}
    </div>
  );
}

export function FindDoctorModal({ open, onClose, consultType, typeLabel, specialties }: FindDoctorModalProps) {
  const [step, setStep] = useState<"form" | "results">("form");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<DoctorSearchResult[] | null>(null);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [isVisible, setIsVisible] = useState(false);

  function handleClose() {
    if (isSearching) return;
    setStep("form");
    setLocation("");
    setDate("");
    setTime("");
    setError(null);
    setResults(null);
    setRadiusKm(DEFAULT_RADIUS_KM);
    onClose();
  }

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => setIsVisible(true));

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", handleKeyDown);
      setIsVisible(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="find-doctor-modal-title"
        onClick={(event) => event.stopPropagation()}
        className={`flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-2xl ring-1 ring-black/5 transition-all duration-200 ease-out ${
          isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-blue-50 to-white px-5 py-4">
          <h3 id="find-doctor-modal-title" className="text-base font-semibold text-slate-900">
            {step === "form" ? `Find a ${typeLabel}` : "Search Results"}
          </h3>
          <button
            type="button"
            aria-label="Close"
            onClick={handleClose}
            disabled={isSearching}
            className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
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
                <DatePickerField date={date} onSelect={setDate} />

                <TimePickerField time={time} onSelect={setTime} />
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
                        className="flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-blue-700 to-blue-800 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:brightness-105 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
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
                    <li key={result.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 transition-shadow hover:shadow-sm">
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
              className="flex items-center gap-2 rounded-lg bg-gradient-to-b from-blue-700 to-blue-800 px-6 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-105 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
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
