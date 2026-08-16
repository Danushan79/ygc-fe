export interface IdentityMismatchSignal {
  field: "name" | "age" | "gender" | string;
  extracted_value: string | null;
  known_value: string | null;
  similarity: number | null;
  severity: "strong" | "weak" | string;
  explanation: string;
}

export interface HeldDocument {
  patient_name: string | null;
  estimated_birth_year: number | null;
  gender: string | null;
  source_files: string[];
  message: string;
  signals: IdentityMismatchSignal[];
  score: number;
  threshold: number;
}

export interface IdentityMismatchDocument {
  label: string;
  patient_name: string | null;
}

/** Present on a successful (201) POST /api/v1/documents response when one
 * or more uploaded documents' extracted identity didn't match this
 * account's document history and were held back rather than merged — see
 * identity_guard.py / api.py's `identity_review_needed` field. Everything
 * else in the response still reflects what WAS successfully added. */
export interface IdentityReviewNeeded {
  error: "patient_name_mismatch";
  message: string;
  known_identity: {
    document_patient_names: string[];
    estimated_birth_year: number | null;
    gender: string | null;
  };
  held_documents: HeldDocument[];
  documents: IdentityMismatchDocument[];
}

/** Matches a held document's `source_files` labels (which may carry a
 * " (page N)" suffix for multi-page PDFs) back to the original File
 * objects the user picked, so only the held ones get resubmitted. */
export function filesForHeldDocuments(allFiles: File[], review: IdentityReviewNeeded): File[] {
  const heldNames = new Set(
    review.held_documents.flatMap((doc) =>
      doc.source_files.map((label) => label.replace(/\s*\(page \d+\)$/, ""))
    )
  );
  return allFiles.filter((file) => heldNames.has(file.name));
}
