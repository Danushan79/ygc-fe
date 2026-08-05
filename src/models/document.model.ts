import { Schema, model, models, type Model } from "mongoose";

const documentRecordSchema = new Schema(
  {
    user_id: { type: String, required: true, index: true },
  },
  { strict: false, collection: "documents" },
);

export const DocumentRecord =
  (models.DocumentRecord as Model<Record<string, unknown>>) ??
  model<Record<string, unknown>>("DocumentRecord", documentRecordSchema);

const patientSnapshotSchema = new Schema(
  {
    user_id: { type: String, required: true, index: true },
  },
  { strict: false, collection: "patient_snapshots" },
);

export const PatientSnapshot =
  (models.PatientSnapshot as Model<Record<string, unknown>>) ??
  model<Record<string, unknown>>("PatientSnapshot", patientSnapshotSchema);
