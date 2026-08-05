import { requireAdminApiSession } from "@/lib/auth/session";
import { HttpError } from "@/lib/http-error";
import { getDashboardOverview } from "@/services/admin-dashboard.service";
import { apiError, apiSuccess } from "@/utils/api-response";

export async function GET() {
  try {
    await requireAdminApiSession();

    const overview = await getDashboardOverview();
    return apiSuccess(overview);
  } catch (error) {
    if (error instanceof HttpError) {
      return apiError(error.message, error.status);
    }
    console.error("Failed to load dashboard overview:", error);
    return apiError("Something went wrong. Please try again.", 500);
  }
}
