"use client";

import { Upload } from "lucide-react";
import { useState } from "react";
import { UploadDocumentModal } from "@/components/dashboard/upload-document-modal";

export function UploadDocumentButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-full items-center gap-2 rounded-lg bg-blue-700 px-3 text-xs font-semibold text-white transition-opacity hover:opacity-90"
      >
        <Upload className="h-4 w-4" strokeWidth={2} />
        Upload Document
      </button>

      <UploadDocumentModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
