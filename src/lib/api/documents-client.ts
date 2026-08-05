import { sendFormData, sendJson } from "@/lib/api/http-client";
import type { UploadDocumentsResult } from "@/types/document";

export { ApiRequestError } from "@/lib/api/http-client";

export function uploadDocumentsRequest(files: File[]): Promise<UploadDocumentsResult> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  return sendFormData<UploadDocumentsResult>("/api/documents", formData);
}

export function getDocumentsRequest(): Promise<UploadDocumentsResult> {
  return sendJson<UploadDocumentsResult>("/api/documents", "GET");
}
