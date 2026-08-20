"use client";

import { Loader2, MessageCircle, Send, TriangleAlert, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ApiRequestError, askAiAssistantRequest } from "@/lib/api/ai-assistant-client";
import type { AiMessageDto } from "@/types/ai-assistant";

export function AiAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AiMessageDto[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [question, setQuestion] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ block: "end" });
    }
  }, [messages, isOpen]);

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
      const result = await askAiAssistantRequest({ question: trimmed, sessionId });
      setSessionId(result.sessionId);
      setMessages((prev) => [...prev, result.message]);
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      {isOpen && (
        <div className="fixed right-6 bottom-24 z-50 flex h-[28rem] w-80 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-2xl ring-1 ring-black/5 sm:w-96">
          <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 bg-gradient-to-r from-blue-50 to-white p-3">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <MessageCircle className="h-4 w-4 text-blue-800" strokeWidth={2} />
              Ask AI Assistant
            </h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-white p-3">
            {messages.length === 0 && !isSending && (
              <p className="p-2 text-center text-xs text-slate-400">
                Ask a question about your medical records to get started.
              </p>
            )}

            {messages.map((message) =>
              message.role === "user" ? (
                <div key={message.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-xl rounded-tr-sm bg-gradient-to-b from-blue-700 to-blue-800 p-2 text-xs leading-tight text-white shadow-sm">
                    {message.content}
                  </div>
                </div>
              ) : (
                <div key={message.id} className="flex justify-start">
                  <div className="max-w-[90%] rounded-xl rounded-tl-sm border border-slate-100 bg-slate-100 p-2 text-xs leading-tight text-slate-900 shadow-sm">
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
              ),
            )}

            {isSending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-xl rounded-tl-sm border border-slate-100 bg-slate-100 p-2 text-slate-500 shadow-sm">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                  <span className="text-xs">Thinking...</span>
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
                className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none transition-shadow focus:border-blue-800 focus:ring-1 focus:ring-blue-800 disabled:opacity-70"
              />
              <button
                type="submit"
                disabled={isSending || !question.trim()}
                className="flex items-center justify-center rounded-lg bg-gradient-to-b from-blue-700 to-blue-800 px-2.5 py-1.5 text-white shadow-sm transition-all hover:brightness-105 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
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
      )}

      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-label={isOpen ? "Close AI assistant" : "Open AI assistant"}
        className="fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-700 to-indigo-700 text-white shadow-lg shadow-blue-900/30 transition-transform hover:scale-105 active:scale-95"
      >
        {isOpen ? (
          <X className="h-6 w-6" strokeWidth={2} />
        ) : (
          <MessageCircle className="h-6 w-6" strokeWidth={2} />
        )}
      </button>
    </>
  );
}
