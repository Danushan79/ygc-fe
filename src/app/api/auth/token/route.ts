import { HttpError } from "@/lib/http-error";
import { createAccessToken } from "@/services/auth.service";
import type { AccessTokenRequestBody } from "@/types/auth";
import { apiError, apiSuccess } from "@/utils/api-response";

/**
 * Exchanges login credentials for an access token.
 *
 * Unlike `/api/auth/signin`, the token is returned in the response body instead
 * of an httpOnly cookie, so non-browser clients can send it as a Bearer token.
 */
export async function POST(request: Request) {
  let body: AccessTokenRequestBody;
  try {
    body = await request.json();
  } catch {
    return apiError("Request body must be valid JSON.", 400);
  }

  try {
    const token = await createAccessToken(body);
    return apiSuccess(token, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof HttpError) {
      return apiError(error.message, error.status);
    }
    console.error("Access token creation failed:", error);
    return apiError("Something went wrong. Please try again.", 500);
  }
}
