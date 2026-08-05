import { HttpError } from "@/lib/http-error";
import type { AiMessageDto, AskAiAssistantRequestBody } from "@/types/ai-assistant";

// TODO: replace this stub with a call to env.aiAssistantApiUrl once the AI Assistant API is available.
export async function askAiAssistant(body: AskAiAssistantRequestBody): Promise<AiMessageDto> {
  const question = body.question?.trim();
  if (!question) {
    throw new HttpError(400, "Question is required.");
  }

  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: "AI Assistant integration is coming soon. Your question has been received.",
    createdAt: new Date().toISOString(),
  };
}
