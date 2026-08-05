"use client";

import { CloudUpload, FileText, Info, Loader2, Trash2, X } from "lucide-react";
import { type ChangeEvent, type DragEvent, useEffect, useRef, useState } from "react";
import { FormBanner } from "@/components/auth/form-banner";
import { ApiRequestError, uploadDocumentsRequest } from "@/lib/api/documents-client";

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const ACCEPTED_EXTENSIONS = ".pdf,.jpg,.jpeg,.png";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadDocumentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleClose() {
    if (isUploading) {
      return;
    }
    setFiles([]);
    setError(null);
    setIsDragActive(false);
    setSuccess(false);
    onClose();
  }

  async function handleUpload() {
    if (files.length === 0 || isUploading) {
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      await uploadDocumentsRequest(files);
      setFiles([]);
      setSuccess(true);
      setTimeout(handleClose, 1200);
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setIsUploading(false);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-modal-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 id="upload-modal-title" className="text-base font-semibold text-slate-900">
            Upload Medical Documents
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

          <div
            onDragOver={(event) => {
              event.preventDefault();
              if (!isUploading) setIsDragActive(true);
            }}
            onDragLeave={() => setIsDragActive(false)}
            onDrop={isUploading ? undefined : handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
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
              className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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

          {success && (
            <div className="mt-3">
              <FormBanner tone="success">Documents uploaded successfully.</FormBanner>
            </div>
          )}

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
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
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
        </div>

        <div className="flex items-center justify-end gap-3 bg-slate-50 p-4">
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
            onClick={handleUpload}
            className="flex items-center gap-2 rounded-lg bg-blue-700 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
