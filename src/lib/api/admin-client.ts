import { sendJson } from "@/lib/api/http-client";
import type { AdminDashboardOverviewDto, AdminUserListQuery, AdminUserSummaryDto } from "@/types/admin";

export function getDashboardOverviewRequest(): Promise<AdminDashboardOverviewDto> {
  return sendJson<AdminDashboardOverviewDto>("/api/admin/dashboard", "GET");
}

export function listUsersRequest(query: AdminUserListQuery): Promise<AdminUserSummaryDto[]> {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);

  const queryString = params.toString();
  return sendJson<AdminUserSummaryDto[]>(
    `/api/admin/users${queryString ? `?${queryString}` : ""}`,
    "GET",
  );
}

export function setUserActiveRequest(
  userId: string,
  isActive: boolean,
): Promise<AdminUserSummaryDto> {
  return sendJson<AdminUserSummaryDto>(`/api/admin/users/${userId}`, "PATCH", { isActive });
}

export function deleteUserRequest(userId: string): Promise<{ deleted: true }> {
  return sendJson<{ deleted: true }>(`/api/admin/users/${userId}`, "DELETE");
}
