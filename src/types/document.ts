export interface DocumentMedication {
  name: string;
  ingredients: string[];
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  dosage_value: number | null;
  dosage_unit: string | null;
  frequency_per_day: number | null;
  is_as_needed: boolean;
  confidence: number | null;
  date?: string;
  source_file?: string;
}

export interface DocumentVisit {
  document_type: string;
  date: string;
  provider_or_doctor: string | null;
  patient_name: string | null;
  medications: DocumentMedication[];
  lab_results: Array<Record<string, unknown>>;
  allergies_noted: string[];
  clinical_notes: string | null;
  illegible_or_low_confidence_fields: string[];
  overall_confidence: number;
  _source: { file: string; method: string };
  document_url: string;
  cloudinary_public_id: string;
  /** When this file was uploaded to the system (ISO 8601, UTC) — distinct
   * from `date`, which is the date printed on the document itself. Absent
   * on documents saved before this field existed. */
  uploaded_at?: string;
}

/** A document a finding traces back to — the prescription's own date plus
 * the filename it was uploaded as. Not a stable ID: two unrelated
 * documents can in principle share a filename, and undated documents
 * carry no date. See ygc/api.py's cross-check response. */
export interface SourceDocumentRef {
  date?: string;
  source_file?: string;
}

export interface PotentialDrugInteraction {
  medications_involved: string[];
  explanation: string;
  severity: "low" | "moderate" | "high" | string;
  confidence: number;
  source_documents?: SourceDocumentRef[];
}

export interface DuplicatePrescriptionOccurrence {
  date?: string;
  source_file?: string;
  dosage?: string;
}

export interface DuplicatePrescription {
  medication: string;
  occurrences: DuplicatePrescriptionOccurrence[];
  explanation: string;
  confidence: number;
}

export type CrossCheckIssue =
  | string
  | {
      medication?: string;
      explanation?: string;
      confidence?: number;
      source_documents?: SourceDocumentRef[];
      conflicting_instructions?: DuplicatePrescriptionOccurrence[];
      [key: string]: unknown;
    };

export interface CrossCheckReport {
  potential_drug_interactions: PotentialDrugInteraction[];
  duplicate_prescriptions: DuplicatePrescription[];
  conflicting_dosage_instructions: CrossCheckIssue[];
  allergy_conflicts: CrossCheckIssue[];
  overall_recommendation: string;
}

export interface TimelineData {
  visits: DocumentVisit[];
  medications_timeline: DocumentMedication[];
  lab_results_timeline: Array<Record<string, unknown>>;
  known_allergies: string[];
}

export interface LabTrendDataPoint {
  /** The date exactly as printed on the report — shown to the reader. */
  date?: string;
  /** The same date normalised to YYYY-MM-DD by the backend, for placing the
   * point on a time axis. Parsing `date` in the browser is not equivalent:
   * "19/12/2023" is 19 December to the backend and an invalid date to
   * JavaScript's Date. */
  date_iso?: string;
  value: unknown;
  /** The number behind `value`, already stripped of digit grouping and
   * comparators ("> 100,000" → 100000). */
  value_numeric?: number;
  flag: string;
  source_file?: string;
}

export interface LabTrend {
  test_name: string;
  /** Canonical id from reference_intervals.py, shared with SingleLabResult
   * and with the backend's lab grouping, so a test printed as "Fasting
   * Glucose" on one report and "FBS" on the next resolves to one key. Null
   * for a test outside that table. */
  test_id?: string | null;
  /** Every spelling this test was printed under across the documents. Lets a
   * raw reading labelled "FBS" find the analysis computed under "Fasting
   * Glucose" without the frontend reimplementing the synonym table. */
  test_names?: string[];
  plain_name?: string | null;
  what_it_measures?: string | null;
  /** One of the tests shown without the reader asking. The rest stay behind
   * the "show all results" toggle rather than being hidden. */
  is_main_test?: boolean;
  unit: string;
  reference_range: string | null;
  /** Parsed bounds behind `reference_range`, for drawing the normal band.
   * Either side may be null for a one-sided range. */
  range_used?: { low: number | null; high: number | null; unit: string } | null;
  data_points: LabTrendDataPoint[];
  direction: string;
  flag_sequence: string;
  crossed_into_abnormal_at: { date?: string; flag: string } | null;
  approaching_threshold: boolean;
  confidence: number;
  explanation: string;
}

/** A test with exactly one reading on file — no trend is possible, so it
 * carries a low/normal/high status instead. See lab_trends.py for the range
 * precedence that produces it: the report's own printed range first, then a
 * general age/sex range, then no status at all. */
export interface SingleLabResult {
  test_name: string;
  test_id?: string | null;
  /** As on LabTrend — every spelling this test was printed under. */
  test_names?: string[];
  plain_name?: string | null;
  what_it_measures?: string | null;
  is_main_test?: boolean;
  date?: string | null;
  value: unknown;
  unit: string;
  source_file?: string | null;
  reference_range?: string | null;
  /** "unknown" means no range was available to compare against — the value
   * is shown with no verdict, which is different from "normal". */
  status: "low" | "normal" | "high" | "unknown";
  /** Where the range came from. "general" must be surfaced to the reader:
   * it is not the range their own laboratory uses. */
  range_source: "report" | "general" | null;
  range_used: { low: number | null; high: number | null; unit: string } | null;
  /** e.g. "for a woman aged 34" — present only when the matched range
   * genuinely depended on sex or age. */
  compared_against?: string | null;
  confidence: number;
  explanation: string;
}

export interface LabTrendsResult {
  trends: LabTrend[];
  /** Absent on snapshots saved before single-reading assessment existed. */
  single_results?: SingleLabResult[];
  patient_context?: {
    sex: string | null;
    age: number | null;
    source: string;
  };
  insufficient_data: { test_name: string; reason: string }[];
  note: string;
}

export interface ConsultAction {
  trigger: string;
  subject?: string;
  detail: string;
  route: string;
  urgency: string;
  why_this_route: string;
  confidence: number;
  /** "clinical" — a finding about the patient, and the only kind that sets
   * consult_needed. "data_quality" — a finding about the document it came
   * from (a scan too poor to trust), reported separately and never a
   * referral. Optional: snapshots saved before the split lack it. */
  category?: "clinical" | "data_quality";
  confidence_caveat?: string;
  is_historical?: boolean;
}

export interface RecommendedSpecialty {
  specialty: string;
  clinical_name?: string | null;
  reason: string;
  confidence: number;
  basis: string;
  urgency: string;
  triggered_by: string[];
}

export interface ConsultTriage {
  consult_needed: boolean;
  headline?: string;
  consult_type: "pharmacist" | "doctor" | "specialist" | string;
  urgency: string;
  urgency_meaning: string;
  confidence: number;
  recommended_specialties: RecommendedSpecialty[];
  pharmacist_actions: ConsultAction[];
  doctor_actions: ConsultAction[];
  referral_items: ConsultAction[];
  /** Documents that could not be read with full confidence. Worth checking
   * against the original paperwork, but never a reason to consult anyone —
   * these are deliberately kept out of referral_items. */
  document_quality_notices?: ConsultAction[];
  document_quality_note?: string | null;
  summary: string;
  emergency_advice: string;
  note: string;
}

export interface UploadDocumentsResult {
  user_id: string;
  documents_added?: number;
  documents_total: number;
  timeline: TimelineData;
  cross_check_report: CrossCheckReport;
  lab_trends?: LabTrendsResult;
  consult_triage?: ConsultTriage;
  indexed?: boolean;
  /** Present when one or more uploaded documents were held back because
   * their extracted patient identity didn't match this account's document
   * history — see IdentityReviewNeeded in identity-mismatch.ts. */
  identity_review_needed?: import("./identity-mismatch").IdentityReviewNeeded;
}
