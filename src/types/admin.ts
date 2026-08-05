export interface AdminUserSummaryDto {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  joinedAt: string;
  lastLoginAt: string | null;
  documentCount: number;
}

export interface AdminUserListQuery {
  search?: string;
  from?: string;
  to?: string;
}

export interface AdminDashboardDocumentTypeCount {
  documentType: string;
  count: number;
}

export interface AdminDashboardUploadDay {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface AdminDashboardSafetyAlert {
  userId: string;
  fullName: string;
  email: string;
  drugInteractions: number;
  duplicatePrescriptions: number;
  conflictingDosage: number;
  allergyConflicts: number;
}

export interface AdminDashboardOverviewDto {
  totalPatients: number;
  activePatients: number;
  newSignups7d: number;
  totalDocuments: number;
  avgConfidence: number | null;
  lowConfidenceDocumentCount: number;
  documentTypeBreakdown: AdminDashboardDocumentTypeCount[];
  uploadsByDay: AdminDashboardUploadDay[];
  safetyAlerts: AdminDashboardSafetyAlert[];
  totalSafetyFlags: number;
}
