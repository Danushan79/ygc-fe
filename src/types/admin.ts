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
