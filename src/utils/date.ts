/** Parses dates in the mixed formats the extraction pipeline produces
 * (ISO-ish strings a native Date can read, plus "DD-MM-YYYY") into an
 * epoch value for sorting. Unparseable dates sort to the very start
 * rather than throwing, since these are for chronological display, not
 * validation. */
export function toSortableTime(dateStr: string): number {
  const native = new Date(dateStr);
  if (!Number.isNaN(native.getTime())) return native.getTime();

  const match = dateStr.trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    if (!Number.isNaN(parsed.getTime())) return parsed.getTime();
  }

  return 0;
}
