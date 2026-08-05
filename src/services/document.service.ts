import { env } from "@/config/env";
import { connectToDatabase } from "@/lib/db";
import { HttpError } from "@/lib/http-error";
import { DocumentRecord, PatientSnapshot } from "@/models/document.model";
import type { UploadDocumentsResult } from "@/types/document";

async function parseJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function extractErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "message" in payload) {
    return String((payload as { message: unknown }).message);
  }

  if (payload && typeof payload === "object" && "detail" in payload) {
    const detail = (payload as { detail: unknown }).detail;
    if (typeof detail === "string") {
      return detail;
    }
    if (Array.isArray(detail)) {
      return detail
        .map((item) =>
          item && typeof item === "object" && "msg" in item ? String((item as { msg: unknown }).msg) : String(item)
        )
        .join("; ");
    }
  }

  return fallback;
}

function extractData(payload: unknown): UploadDocumentsResult {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: UploadDocumentsResult }).data;
  }

  return payload as UploadDocumentsResult;
}

export async function uploadDocuments(
  formData: FormData,
  auth: { token: string; userId: string }
): Promise<UploadDocumentsResult> {
  let response: Response;
  try {
    response = await fetch(`${env.documentsApiBaseUrl}/api/v1/documents`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "X-User-Id": auth.userId,
      },
      body: formData,
    });
  } catch {
    throw new HttpError(502, "Unable to reach the documents service. Please try again.");
  }

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    console.error("[uploadDocuments] external API error:", response.status, JSON.stringify(payload));
    throw new HttpError(response.status, extractErrorMessage(payload, "Failed to upload documents. Please try again."));
  }

  return extractData(payload);
}

export async function getDocuments(userId: string): Promise<UploadDocumentsResult | null> {
  await connectToDatabase();

  const snapshot = await PatientSnapshot.findOne({ user_id: userId }).lean<{
    user_id: string;
    patient_timeline: UploadDocumentsResult["timeline"];
    cross_check_report: UploadDocumentsResult["cross_check_report"];
  } | null>();

  console.log("[getDocuments] userId:", userId, "snapshot found:", Boolean(snapshot));

  if (!snapshot) {
    return null;
  }

  const documentsTotal = await DocumentRecord.countDocuments({ user_id: userId });

  const result: UploadDocumentsResult = {
    user_id: snapshot.user_id,
    documents_total: documentsTotal,
    timeline: snapshot.patient_timeline,
    cross_check_report: snapshot.cross_check_report,
  };

  console.log("[getDocuments] visits:", result.timeline?.visits?.length ?? 0, "documents_total:", documentsTotal);

  return result;
}
