import { connectToDatabase } from "@/lib/db";
import { countUserDocuments } from "@/lib/cloudinary";
import { DocumentRecord, PatientSnapshot } from "@/models/document.model";
import { User } from "@/models/user.model";
import type { AdminDashboardOverviewDto, AdminDashboardSafetyAlert } from "@/types/admin";

const UPLOADS_WINDOW_DAYS = 7;
const LOW_CONFIDENCE_THRESHOLD = 0.85;

interface CrossCheckReport {
  potential_drug_interactions?: unknown[];
  duplicate_prescriptions?: unknown[];
  conflicting_dosage_instructions?: unknown[];
  allergy_conflicts?: unknown[];
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function totalFlags(alert: AdminDashboardSafetyAlert): number {
  return (
    alert.drugInteractions +
    alert.duplicatePrescriptions +
    alert.conflictingDosage +
    alert.allergyConflicts
  );
}

export async function getDashboardOverview(): Promise<AdminDashboardOverviewDto> {
  await connectToDatabase();

  const [totalPatients, activePatients, newSignups7d, patients] = await Promise.all([
    User.countDocuments({ role: "user" }),
    User.countDocuments({ role: "user", isActive: true }),
    User.countDocuments({ role: "user", createdAt: { $gte: daysAgo(7) } }),
    User.find({ role: "user" }).select("fullName email").lean(),
  ]);

  // Document counts live in Cloudinary (one folder per user_id), not Mongo.
  const documentCounts = await Promise.all(
    patients.map((patient) =>
      countUserDocuments(String(patient._id)).catch((error) => {
        console.error(`Failed to count Cloudinary documents for user ${patient._id}:`, error);
        return 0;
      }),
    ),
  );
  const totalDocuments = documentCounts.reduce((sum, count) => sum + count, 0);

  const windowStartIso = daysAgo(UPLOADS_WINDOW_DAYS - 1).toISOString();

  const [typeBreakdownAgg, confidenceAgg, lowConfidenceDocumentCount, uploadsByDayAgg, snapshots] =
    await Promise.all([
      DocumentRecord.aggregate<{ _id: string | null; count: number }>([
        { $group: { _id: "$document_type", count: { $sum: 1 } } },
      ]),
      DocumentRecord.aggregate<{ _id: null; avg: number | null }>([
        { $group: { _id: null, avg: { $avg: "$overall_confidence" } } },
      ]),
      DocumentRecord.countDocuments({
        $or: [
          { overall_confidence: { $lt: LOW_CONFIDENCE_THRESHOLD } },
          { "illegible_or_low_confidence_fields.0": { $exists: true } },
        ],
      }),
      DocumentRecord.aggregate<{ _id: string; count: number }>([
        { $match: { uploaded_at: { $gte: windowStartIso } } },
        { $group: { _id: { $substr: ["$uploaded_at", 0, 10] }, count: { $sum: 1 } } },
      ]),
      PatientSnapshot.find({}).select("user_id cross_check_report").lean(),
    ]);

  const uploadsByDate = new Map(uploadsByDayAgg.map((day) => [day._id, day.count]));
  const uploadsByDay = Array.from({ length: UPLOADS_WINDOW_DAYS }, (_, index) => {
    const date = daysAgo(UPLOADS_WINDOW_DAYS - 1 - index);
    const key = dateKey(date);
    return { date: key, count: uploadsByDate.get(key) ?? 0 };
  });

  const patientById = new Map(patients.map((patient) => [String(patient._id), patient]));
  const safetyAlerts = snapshots
    .map((snapshot): AdminDashboardSafetyAlert => {
      const report = (snapshot.cross_check_report ?? {}) as CrossCheckReport;
      const patient = patientById.get(String(snapshot.user_id));
      return {
        userId: String(snapshot.user_id),
        fullName: patient?.fullName ?? "Unknown patient",
        email: patient?.email ?? "—",
        drugInteractions: report.potential_drug_interactions?.length ?? 0,
        duplicatePrescriptions: report.duplicate_prescriptions?.length ?? 0,
        conflictingDosage: report.conflicting_dosage_instructions?.length ?? 0,
        allergyConflicts: report.allergy_conflicts?.length ?? 0,
      };
    })
    .filter((alert) => totalFlags(alert) > 0)
    .sort((a, b) => totalFlags(b) - totalFlags(a));

  return {
    totalPatients,
    activePatients,
    newSignups7d,
    totalDocuments,
    avgConfidence: confidenceAgg[0]?.avg ?? null,
    lowConfidenceDocumentCount,
    documentTypeBreakdown: typeBreakdownAgg.map((entry) => ({
      documentType: entry._id ?? "unknown",
      count: entry.count,
    })),
    uploadsByDay,
    safetyAlerts,
    totalSafetyFlags: safetyAlerts.reduce((sum, alert) => sum + totalFlags(alert), 0),
  };
}
