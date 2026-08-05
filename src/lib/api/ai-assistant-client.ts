import { sendJson } from "@/lib/api/http-client";
import type { AskAiAssistantRequestBody, AskAiAssistantResponseDto } from "@/types/ai-assistant";

export { ApiRequestError } from "@/lib/api/http-client";

export function askAiAssistantRequest(
  body: AskAiAssistantRequestBody,
): Promise<AskAiAssistantResponseDto> {
  return sendJson<AskAiAssistantResponseDto>("/api/ai-assistant/ask", "POST", body);
}
