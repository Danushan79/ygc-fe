import { env } from "@/config/env";
import { HttpError } from "@/lib/http-error";
import type { UploadDocumentsResult } from "@/types/document";

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

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message: unknown }).message)
        : "Failed to upload documents. Please try again.";
    throw new HttpError(response.status, message);
  }

  return (payload as UploadDocumentsResult) ?? {};
}
