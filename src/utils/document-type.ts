import { FlaskConical, Pill, Stethoscope, type LucideIcon } from "lucide-react";

export function iconForDocumentType(documentType: string): LucideIcon {
  const normalized = documentType.toLowerCase();
  if (normalized.includes("prescription")) return Pill;
  if (normalized.includes("lab")) return FlaskConical;
  return Stethoscope;
}

export function formatDocumentType(documentType: string): string {
  return documentType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
