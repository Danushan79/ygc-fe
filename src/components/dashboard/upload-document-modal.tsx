"use client";

import { AlertTriangle, CloudUpload, FileText, Info, Loader2, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type DragEvent, useEffect, useRef, useState } from "react";
import { FormBanner } from "@/components/auth/form-banner";
import { ApiRequestError, uploadDocumentsRequest } from "@/lib/api/documents-client";
import { filesForHeldDocuments, type IdentityReviewNeeded } from "@/types/identity-mismatch";

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const ACCEPTED_EXTENSIONS = ".pdf,.jpg,.jpeg,.png";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadDocumentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  // Set after a successful upload that held some document(s) back pending
  // confirmation (matched documents from that same upload are already
  // saved — this is a follow-up step, not a blocking failure).
  const [review, setReview] = useState<IdentityReviewNeeded | null>(null);
  const [heldFiles, setHeldFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleClose() {
    if (isUploading) {
      return;
    }
    setFiles([]);
    setError(null);
    setReview(null);
    setHeldFiles([]);
    setIsDragActive(false);
    onClose();
  }

  async function handleUpload(confirmMismatch = false, filesOverride?: File[]) {
    const filesToSend = filesOverride ?? files;
    if (filesToSend.length === 0 || isUploading) {
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      const result = await uploadDocumentsRequest(filesToSend, { confirmNameMismatch: confirmMismatch });
      setIsUploading(false);

      // Some document(s) matched and are already saved; the rest were held
      // back and need explicit confirmation before they're added too.
      if (result.identity_review_needed && !confirmMismatch) {
        setReview(result.identity_review_needed);
        setHeldFiles(filesForHeldDocuments(filesToSend, result.identity_review_needed));
        router.refresh();
        return;
      }

      setReview(null);
      setHeldFiles([]);
      setFiles([]);
      onClose();
      router.refresh();
    } catch (err) {
      setIsUploading(false);
      setError(
        err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again."
      );
    }
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) {
    return null;
  }

  function addFiles(fileList: FileList) {
    const incoming = Array.from(fileList);
    const rejected: string[] = [];
    const accepted: File[] = [];

    for (const file of incoming) {
      if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
        rejected.push(`${file.name} (unsupported format)`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        rejected.push(`${file.name} (over 20MB)`);
        continue;
      }
      accepted.push(file);
    }

    setFiles((prev) => [...prev, ...accepted]);
    setError(rejected.length > 0 ? `Couldn't add: ${rejected.join(", ")}` : null);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);
    if (event.dataTransfer.files.length > 0) {
      addFiles(event.dataTransfer.files);
    }
  }

  function handleBrowseChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files.length > 0) {
      addFiles(event.target.files);
    }
    event.target.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-modal-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-2xl ring-1 ring-black/5"
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 id="upload-modal-title" className="text-base font-semibold text-slate-900">
            {review ? "Some Documents Need Review" : "Upload Medical Documents"}
          </h3>
          <button
            type="button"
            aria-label="Close"
            onClick={handleClose}
            disabled={isUploading}
            className="rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <div className="relative p-6">
          {isUploading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-b-none bg-white/85 backdrop-blur-sm">
              <div className="relative flex h-14 w-14 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-20" />
                <span className="absolute h-full w-full rounded-full border-2 border-blue-100" />
                <Loader2 className="relative h-7 w-7 animate-spin text-blue-700" strokeWidth={2} />
              </div>
              <p className="text-sm font-medium text-slate-700">
                Uploading {files.length} file{files.length === 1 ? "" : "s"}...
              </p>
            </div>
          )}

          {review ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" strokeWidth={2} />
                <p className="text-sm text-amber-900">{review.message}</p>
              </div>

              <ul className="space-y-2">
                {review.held_documents.map((doc, docIndex) => (
                  <li
                    key={`${doc.patient_name ?? "unknown"}-${docIndex}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                  >
                    <p className="font-medium text-slate-900">{doc.patient_name ?? "Unknown patient"}</p>
                    <p className="text-xs text-slate-500">{doc.source_files.join(", ")}</p>
                    <ul className="mt-1 space-y-1">
                      {doc.signals.map((signal, signalIndex) => (
                        <li key={`${signal.field}-${signalIndex}`} className="text-xs text-slate-600">
                          <span className="font-medium capitalize">{signal.field}:</span>{" "}
                          {signal.explanation}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>

              <p className="text-xs text-slate-500">
                These document(s) weren&apos;t added because they don&apos;t match the patient on
                your other documents. If they really do belong to you, confirm to add them anyway.
              </p>
            </div>
          ) : (
            <>
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!isUploading) setIsDragActive(true);
                }}
                onDragLeave={() => setIsDragActive(false)}
                onDrop={isUploading ? undefined : handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors ${
                  isDragActive
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-300 bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <CloudUpload className="h-8 w-8 text-blue-700" strokeWidth={2} />
                <div className="text-center">
                  <p className="text-sm text-slate-900">Drag &amp; Drop files here</p>
                  <p className="text-xs text-slate-500">or</p>
                </div>
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={(event) => {
                    event.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="rounded-lg bg-gradient-to-b from-blue-700 to-blue-800 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:brightness-105 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Browse Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_EXTENSIONS}
                  multiple
                  disabled={isUploading}
                  className="hidden"
                  onChange={handleBrowseChange}
                />
              </div>

              {error && (
                <div className="mt-3">
                  <FormBanner tone="error">{error}</FormBanner>
                </div>
              )}

              {files.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <li
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <FileText className="h-4 w-4 flex-shrink-0 text-blue-700" strokeWidth={2} />
                        <span className="truncate text-sm text-slate-900">{file.name}</span>
                        <span className="flex-shrink-0 text-xs text-slate-500">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${file.name}`}
                        disabled={isUploading}
                        onClick={() => removeFile(index)}
                        className="flex-shrink-0 rounded p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 space-y-1">
                <p className="flex items-center gap-1 text-xs text-slate-500">
                  <Info className="h-3.5 w-3.5" strokeWidth={2} />
                  Supported formats: PDF, JPG, PNG
                </p>
                <p className="flex items-center gap-1 text-xs text-slate-500">
                  <Info className="h-3.5 w-3.5" strokeWidth={2} />
                  Maximum file size: 20MB
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 bg-slate-50 p-4">
          {review ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                disabled={isUploading}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-blue-800 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Not Now
              </button>
              <button
                type="button"
                disabled={isUploading || heldFiles.length === 0}
                onClick={() => handleUpload(true, heldFiles)}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-b from-amber-600 to-amber-700 px-6 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-105 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUploading && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
                {isUploading ? "Uploading..." : "Add Anyway"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleClose}
                disabled={isUploading}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-blue-800 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={files.length === 0 || isUploading}
                onClick={() => handleUpload(false)}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-b from-blue-700 to-blue-800 px-6 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-105 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUploading && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
                {isUploading ? "Uploading..." : "Upload"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
