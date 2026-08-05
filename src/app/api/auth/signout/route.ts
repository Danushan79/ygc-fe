import { clearAuthCookie } from "@/lib/auth/cookies";
import { apiSuccess } from "@/utils/api-response";

export async function POST() {
  const response = apiSuccess({ signedOut: true });
  clearAuthCookie(response);
  return response;
}
