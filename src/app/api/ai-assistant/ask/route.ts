import { getSessionWithToken } from "@/lib/auth/session";
import { HttpError } from "@/lib/http-error";
import { askAiAssistant } from "@/services/ai-assistant.service";
import type { AskAiAssistantRequestBody } from "@/types/ai-assistant";
import { apiError, apiSuccess } from "@/utils/api-response";

export async function POST(request: Request) {
  const auth = await getSessionWithToken();
  if (!auth) {
    return apiError("You must be signed in.", 401);
  }

  let body: AskAiAssistantRequestBody;
  try {
    body = await request.json();
  } catch {
    return apiError("Request body must be valid JSON.", 400);
  }

  try {
    const result = await askAiAssistant(body, { token: auth.token, userId: auth.session.sub });
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof HttpError) {
      return apiError(error.message, error.status);
    }
    console.error("AI Assistant request failed:", error);
    return apiError("Something went wrong. Please try again.", 500);
  }
}
