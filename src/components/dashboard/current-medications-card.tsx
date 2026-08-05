import { Pill, Plus } from "lucide-react";
import type { DocumentMedication } from "@/types/document";

interface CurrentMedicationsCardProps {
  medications: DocumentMedication[];
}

function formatDose(medication: DocumentMedication): string {
  if (medication.dosage_value !== null && medication.dosage_unit) {
    return `${medication.dosage_value}${medication.dosage_unit}`;
  }
  return medication.dosage ?? "";
}

export function CurrentMedicationsCard({ medications }: CurrentMedicationsCardProps) {
  return (
    <div className="flex-shrink-0 rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between rounded-t-lg border-b border-slate-200 bg-slate-50 p-2.5">
        <h3 className="text-sm font-semibold text-slate-900">Current Meds</h3>
        <button type="button" className="text-xs text-blue-800 hover:underline">
          View all
        </button>
      </div>

      {medications.length === 0 ? (
        <p className="p-3 text-xs text-slate-500">No medications recorded yet.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {medications.map((medication, index) => (
            <div key={`${medication.name}-${index}`} className="flex items-start gap-2 p-2">
              <div className="rounded bg-green-50 p-1 text-green-600">
                <Pill className="h-3.5 w-3.5" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <p className="flex justify-between text-xs text-slate-900">
                  {medication.name} <span className="font-normal text-slate-500">{formatDose(medication)}</span>
                </p>
                <p className="text-[10px] text-slate-500">
                  {medication.frequency ?? medication.duration ?? "No instructions available"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-slate-200 p-2 text-center">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-1 rounded py-1 text-[11px] font-medium text-blue-800 transition-colors hover:bg-slate-50"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          Add Medication
        </button>
      </div>
    </div>
  );
}
