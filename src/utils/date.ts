/** Parses dates in the mixed formats the extraction pipeline produces
 * (ISO-ish strings a native Date can read, plus "DD-MM-YYYY"). Returns
 * null rather than throwing when the string can't be parsed, since these
 * come from OCR extraction and aren't guaranteed well-formed. */
function parseExtractedDate(dateStr: string): Date | null {
  const native = new Date(dateStr);
  if (!Number.isNaN(native.getTime())) return native;

  const match = dateStr.trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

/** Epoch value for sorting. Unparseable dates sort to the very start
 * rather than throwing, since these are for chronological display, not
 * validation. */
export function toSortableTime(dateStr: string): number {
  return parseExtractedDate(dateStr)?.getTime() ?? 0;
}

/** Renders an extracted date in ISO 8601 (YYYY-MM-DD) so every date in the
 * app reads the same way regardless of the format it was extracted in.
 * Falls back to the raw string when it can't be parsed, so a bad OCR read
 * is still visible instead of disappearing. */
export function formatDisplayDate(dateStr?: string | null): string | undefined {
  if (!dateStr) return dateStr ?? undefined;
  const parsed = parseExtractedDate(dateStr);
  if (!parsed) return dateStr;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
