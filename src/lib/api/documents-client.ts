import { sendFormData, sendJson } from "@/lib/api/http-client";
import type { UploadDocumentsResult } from "@/types/document";

export { ApiRequestError } from "@/lib/api/http-client";

export function uploadDocumentsRequest(
  files: File[],
  options?: { confirmNameMismatch?: boolean }
): Promise<UploadDocumentsResult> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }
  if (options?.confirmNameMismatch) {
    formData.append("confirm_name_mismatch", "true");
  }

  return sendFormData<UploadDocumentsResult>("/api/documents", formData);
}

export function getDocumentsRequest(): Promise<UploadDocumentsResult> {
  return sendJson<UploadDocumentsResult>("/api/documents", "GET");
}
