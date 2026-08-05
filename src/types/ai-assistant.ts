export type AiMessageRole = "user" | "assistant";

export interface AiMessageDto {
  id: string;
  role: AiMessageRole;
  content: string;
  createdAt: string;
  warning?: string;
}

export interface AskAiAssistantRequestBody {
  question: string;
  sessionId?: string;
}

export interface AskAiAssistantResponseDto {
  message: AiMessageDto;
  sessionId: string;
}
