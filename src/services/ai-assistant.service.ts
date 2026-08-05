import { env } from "@/config/env";
import { HttpError } from "@/lib/http-error";
import type {
  AskAiAssistantRequestBody,
  AskAiAssistantResponseDto,
} from "@/types/ai-assistant";

interface ExternalAuth {
  token: string;
  userId: string;
}

interface SessionMessageResult {
  answer: string;
  confidence: number;
  sources: { date: string; source_file: string }[];
  recommend_professional_consult: boolean;
}

const NOT_MEDICAL_ADVICE_WARNING =
  "This isn't a substitute for professional medical advice — please check with your doctor or pharmacist.";

function authHeaders(auth: ExternalAuth): HeadersInit {
  return {
    Authorization: `Bearer ${auth.token}`,
    "X-User-Id": auth.userId,
    "Content-Type": "application/json",
  };
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "detail" in payload) {
    const detail = (payload as { detail: unknown }).detail;
    if (typeof detail === "string") {
      return detail;
    }
  }
  return fallback;
}

/** Starts a new conversation session on the AI assistant backend (in-memory
 * there — see conversation.py — so this is also the recovery path when an
 * existing session_id has been forgotten by a restarted backend). */
async function createSession(auth: ExternalAuth): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${env.documentsApiBaseUrl}/api/v1/sessions`, {
      method: "POST",
      headers: authHeaders(auth),
    });
  } catch {
    throw new HttpError(502, "Unable to reach the AI assistant service. Please try again.");
  }

  const payload = await parseJsonResponse(response);
  if (!response.ok) {
    throw new HttpError(
      response.status,
      extractErrorMessage(payload, "Failed to start a conversation session."),
    );
  }

  return (payload as { session_id: string }).session_id;
}

async function postMessage(
  sessionId: string,
  question: string,
  auth: ExternalAuth,
): Promise<Response> {
  try {
    return await fetch(`${env.documentsApiBaseUrl}/api/v1/sessions/${sessionId}/messages`, {
      method: "POST",
      headers: authHeaders(auth),
      body: JSON.stringify({ question }),
    });
  } catch {
    throw new HttpError(502, "Unable to reach the AI assistant service. Please try again.");
  }
}

export async function askAiAssistant(
  body: AskAiAssistantRequestBody,
  auth: ExternalAuth,
): Promise<AskAiAssistantResponseDto> {
  const question = body.question?.trim();
  if (!question) {
    throw new HttpError(400, "Question is required.");
  }

  let sessionId = body.sessionId;
  if (!sessionId) {
    sessionId = await createSession(auth);
  }

  let response = await postMessage(sessionId, question, auth);

  if (response.status === 404) {
    // The session the client remembered no longer exists on the backend.
    sessionId = await createSession(auth);
    response = await postMessage(sessionId, question, auth);
  }

  const payload = await parseJsonResponse(response);
  if (!response.ok) {
    console.error("[askAiAssistant] external API error:", response.status, JSON.stringify(payload));
    throw new HttpError(
      response.status,
      extractErrorMessage(payload, "Failed to get an answer. Please try again."),
    );
  }

  const result = payload as SessionMessageResult;

  return {
    sessionId,
    message: {
      id: crypto.randomUUID(),
      role: "assistant",
      content: result.answer,
      createdAt: new Date().toISOString(),
      warning: result.recommend_professional_consult ? NOT_MEDICAL_ADVICE_WARNING : undefined,
    },
  };
}
