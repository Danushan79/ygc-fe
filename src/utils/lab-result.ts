const ABNORMAL_FLAGS = new Set(["high", "low", "critical", "abnormal", "out_of_range", "out-of-range"]);

export function isLabResultFlagged(result: Record<string, unknown>): boolean {
  const flag = result.flag;
  if (typeof flag === "string") {
    return ABNORMAL_FLAGS.has(flag.toLowerCase());
  }
  return Boolean(result.flagged ?? result.is_abnormal ?? result.out_of_range ?? result.is_flagged);
}

export function formatLabResult(result: Record<string, unknown>) {
  const label = String(result.test_name ?? result.label ?? result.name ?? "Lab Result");
  const rawValue = result.value;
  const unit = result.unit ? ` ${result.unit}` : "";
  const value =
    rawValue !== undefined && rawValue !== null && rawValue !== "" ? `${rawValue}${unit}` : "—";
  const date = result.date ? String(result.date) : null;
  const flagged = isLabResultFlagged(result);

  return { label, value, date, flagged };
}
