import { getSession } from "@/lib/auth/session";
import { HttpError } from "@/lib/http-error";
import { updateProfile } from "@/services/auth.service";
import type { UpdateProfileRequestBody } from "@/types/auth";
import { apiError, apiSuccess } from "@/utils/api-response";

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return apiError("You must be signed in.", 401);
  }

  let body: UpdateProfileRequestBody;
  try {
    body = await request.json();
  } catch {
    return apiError("Request body must be valid JSON.", 400);
  }

  try {
    const user = await updateProfile(session.sub, body);
    return apiSuccess(user);
  } catch (error) {
    if (error instanceof HttpError) {
      return apiError(error.message, error.status);
    }
    console.error("Profile update failed:", error);
    return apiError("Something went wrong. Please try again.", 500);
  }
}
