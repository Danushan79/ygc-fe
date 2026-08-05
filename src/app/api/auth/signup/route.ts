import { setAuthCookie } from "@/lib/auth/cookies";
import { HttpError } from "@/lib/http-error";
import { signUp } from "@/services/auth.service";
import type { SignUpRequestBody } from "@/types/auth";
import { apiError, apiSuccess } from "@/utils/api-response";

export async function POST(request: Request) {
  let body: SignUpRequestBody;
  try {
    body = await request.json();
  } catch {
    return apiError("Request body must be valid JSON.", 400);
  }

  try {
    const { user, token } = await signUp(body);
    const response = apiSuccess(user, { status: 201 });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    if (error instanceof HttpError) {
      return apiError(error.message, error.status);
    }
    console.error("Sign up failed:", error);
    return apiError("Something went wrong. Please try again.", 500);
  }
}
