"use client";

import { Loader2, MessageCircle, Send, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ApiRequestError, askAiAssistantRequest } from "@/lib/api/ai-assistant-client";
import type { AiMessageDto } from "@/types/ai-assistant";

const INITIAL_MESSAGES: AiMessageDto[] = [
  {
    id: "seed-question",
    role: "user",
    content: "Did my new med get prescribed despite allergy noted last year?",
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed-answer",
    role: "assistant",
    content:
      "Yes. Amoxicillin was prescribed Jul 15, 2026, but you have an allergy to Penicillin (Dec 2025).",
    createdAt: new Date().toISOString(),
    warning: "Amoxicillin is in the penicillin family.",
  },
];

export function AskAiCard() {
  const [messages, setMessages] = useState<AiMessageDto[]>(INITIAL_MESSAGES);
  const [question, setQuestion] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isSending) {
      return;
    }

    setError(null);
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: trimmed, createdAt: new Date().toISOString() },
    ]);
    setQuestion("");
    setIsSending(true);

    try {
      const answer = await askAiAssistantRequest({ question: trimmed });
      setMessages((prev) => [...prev, answer]);
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-[360px] flex-shrink-0 flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex-shrink-0 border-b border-slate-200 bg-slate-50 p-2.5">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
          <MessageCircle className="h-4 w-4 text-blue-800" strokeWidth={2} />
          Ask AI Assistant
        </h3>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-white p-2">
        {messages.map((message) =>
          message.role === "user" ? (
            <div key={message.id} className="flex justify-end">
              <div className="max-w-[90%] rounded-lg rounded-tr-none bg-blue-800 p-2 text-[11px] leading-tight text-white shadow-sm">
                {message.content}
              </div>
            </div>
          ) : (
            <div key={message.id} className="flex justify-start">
              <div className="max-w-[95%] rounded-lg rounded-tl-none border border-slate-100 bg-slate-100 p-2 text-[11px] leading-tight text-slate-900 shadow-sm">
                <p className={message.warning ? "mb-1.5" : undefined}>{message.content}</p>
                {message.warning && (
                  <div className="flex items-start gap-1.5 rounded border border-yellow-200 bg-yellow-50 p-1.5">
                    <TriangleAlert
                      className="h-3.5 w-3.5 flex-shrink-0 text-yellow-700"
                      strokeWidth={2}
                    />
                    <span className="text-[10px] text-yellow-900">{message.warning}</span>
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {isSending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-lg rounded-tl-none border border-slate-100 bg-slate-100 p-2 text-slate-500 shadow-sm">
              <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
              <span className="text-[11px]">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="flex-shrink-0 border-t border-slate-200 bg-white p-2">
        {error && <p className="mb-1.5 text-[10px] text-red-600">{error}</p>}
        <form onSubmit={handleSend} className="relative flex gap-1.5">
          <input
            type="text"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            disabled={isSending}
            placeholder="Ask a question..."
            className="flex-1 rounded border border-slate-200 px-2 py-1 text-[11px] outline-none focus:border-blue-800 focus:ring-1 focus:ring-blue-800 disabled:opacity-70"
          />
          <button
            type="submit"
            disabled={isSending || !question.trim()}
            className="flex items-center justify-center rounded bg-blue-800 px-2 py-1 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
            ) : (
              <Send className="h-3.5 w-3.5" strokeWidth={2} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
