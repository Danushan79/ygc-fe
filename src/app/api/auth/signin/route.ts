import { setAuthCookie } from "@/lib/auth/cookies";
import { HttpError } from "@/lib/http-error";
import { signIn } from "@/services/auth.service";
import type { SignInRequestBody } from "@/types/auth";
import { apiError, apiSuccess } from "@/utils/api-response";

export async function POST(request: Request) {
  let body: SignInRequestBody;
  try {
    body = await request.json();
  } catch {
    return apiError("Request body must be valid JSON.", 400);
  }

  try {
    const { user, token } = await signIn(body);
    const response = apiSuccess(user, { status: 200 });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    if (error instanceof HttpError) {
      return apiError(error.message, error.status);
    }
    console.error("Sign in failed:", error);
    return apiError("Something went wrong. Please try again.", 500);
  }
}
