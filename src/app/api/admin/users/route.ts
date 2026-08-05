import { NextRequest } from "next/server";
import { requireAdminApiSession } from "@/lib/auth/session";
import { HttpError } from "@/lib/http-error";
import { listUsers } from "@/services/admin-user.service";
import { apiError, apiSuccess } from "@/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    await requireAdminApiSession();

    const searchParams = request.nextUrl.searchParams;
    const users = await listUsers({
      search: searchParams.get("search") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });

    return apiSuccess(users);
  } catch (error) {
    if (error instanceof HttpError) {
      return apiError(error.message, error.status);
    }
    console.error("Failed to list users:", error);
    return apiError("Something went wrong. Please try again.", 500);
  }
}
