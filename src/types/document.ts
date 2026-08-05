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
}

export interface PotentialDrugInteraction {
  medications_involved: string[];
  explanation: string;
  severity: "low" | "moderate" | "high" | string;
  confidence: number;
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

export type CrossCheckIssue = string | { medication?: string; explanation?: string; [key: string]: unknown };

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

export interface UploadDocumentsResult {
  user_id: string;
  documents_added?: number;
  documents_total: number;
  timeline: TimelineData;
  cross_check_report: CrossCheckReport;
  indexed?: boolean;
}
