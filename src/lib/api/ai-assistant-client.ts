import { sendJson } from "@/lib/api/http-client";
import type { AiMessageDto, AskAiAssistantRequestBody } from "@/types/ai-assistant";

export { ApiRequestError } from "@/lib/api/http-client";

export function askAiAssistantRequest(body: AskAiAssistantRequestBody): Promise<AiMessageDto> {
  return sendJson<AiMessageDto>("/api/ai-assistant/ask", "POST", body);
}
