"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Atom,
  BookOpenCheck,
  ChevronRight,
  GraduationCap,
  Library,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { TextbookSelector } from "@/components/chat/TextbookSelector";
import { useConversations } from "@/components/chat/ConversationProvider";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { chatApi, conversationApi, textbookApi } from "@/services/api";
import type { Conversation, Message, Textbook } from "@/types";

const suggestions = [
  "Explain Newton's second law with an example.",
  "Derive the range of a projectile on level ground.",
  "What is the principle of conservation of momentum?",
  "How does a capacitor store electrical energy?",
];

function TypingIndicator() {
  return (
    <div className="flex animate-fade-in gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-cyan-400 text-white">
        <Atom className="h-4 w-4" />
      </span>
      <div className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-edge bg-panel/70 px-4 py-3.5">
        <span className="text-xs text-muted">Searching the textbook</span>
        <span className="flex gap-1">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-soft"
              style={{ animationDelay: `${dot * 150}ms` }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

export function ChatScreen({ conversationId }: { conversationId?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { refresh } = useConversations();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [textbooksLoading, setTextbooksLoading] = useState(true);
  const [selectedTextbookId, setSelectedTextbookId] = useState<string | null>(
    null,
  );
  const [initialLoading, setInitialLoading] = useState(Boolean(conversationId));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    textbookApi
      .list()
      .then((response) => {
        if (!cancelled) setTextbooks(response.textbooks);
      })
      .catch(() => {
        if (!cancelled) setTextbooks([]);
      })
      .finally(() => {
        if (!cancelled) setTextbooksLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!conversationId) {
      setConversation(null);
      setMessages([]);
      setSelectedTextbookId(null);
      setInitialLoading(false);
      setError(null);
      return;
    }

    setInitialLoading(true);
    setError(null);

    conversationApi
      .get(conversationId)
      .then((detail) => {
        if (cancelled) return;
        setConversation(detail.conversation);
        setMessages(detail.messages);
        setSelectedTextbookId(detail.conversation.textbookId);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "This conversation could not be loaded.",
        );
      })
      .finally(() => {
        if (!cancelled) setInitialLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: messages.length > 2 ? "smooth" : "auto",
      block: "end",
    });
  }, [messages, sending]);

  async function handleSend(message: string): Promise<boolean> {
    if (sending) return false;

    const temporaryId = `pending-${Date.now()}`;
    const optimistic: Message = {
      id: temporaryId,
      conversationId: conversation?.id ?? "pending",
      role: "user",
      content: message,
      citations: [],
      usage: null,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    setError(null);
    setSending(true);
    setMessages((current) => [...current, optimistic]);

    try {
      const response = await chatApi.send({
        message,
        conversationId: conversation?.id,
        textbookId: selectedTextbookId,
      });

      setConversation(response.conversation);
      setSelectedTextbookId(response.conversation.textbookId);
      setMessages((current) => [
        ...current.filter((item) => item.id !== temporaryId),
        response.userMessage,
        response.assistantMessage,
      ]);
      setRemaining(response.remainingMessages);
      void refresh();

      if (!conversation?.id) {
        router.replace(`/chat/${response.conversation.id}`, { scroll: false });
      }

      return true;
    } catch (err) {
      setMessages((current) =>
        current.filter((item) => item.id !== temporaryId),
      );
      setError(
        err instanceof Error
          ? err.message
          : "The tutor could not answer. Please try again.",
      );
      return false;
    } finally {
      setSending(false);
    }
  }

  async function handleTextbookChange(value: string | null) {
    setSelectedTextbookId(value);

    if (!conversation?.id) return;

    try {
      const response = await conversationApi.update(conversation.id, {
        textbookId: value,
      });
      setConversation(response.conversation);
      void refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The textbook scope could not be updated.",
      );
    }
  }

  if (initialLoading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Spinner label="Opening conversation" />
      </div>
    );
  }

  const selectedTextbook = textbooks.find(
    (textbook) => textbook.id === selectedTextbookId,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-edge/70 bg-panel/40 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-brand/20 bg-brand/10 text-brand-soft sm:flex">
            <GraduationCap className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <h1 className="max-w-[42vw] truncate text-sm font-semibold text-ink sm:max-w-md">
              {conversation?.title ?? "New conversation"}
            </h1>
            <p className="flex items-center gap-1.5 text-[11px] text-muted">
              <ShieldCheck className="h-3 w-3 text-emerald-300" />
              {selectedTextbook
                ? selectedTextbook.title
                : textbooks.length > 0
                  ? `${textbooks.length} indexed textbook${textbooks.length === 1 ? "" : "s"}`
                  : "Waiting for an indexed textbook"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge tone="green" className="hidden lg:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Strict grounding
          </Badge>
          <TextbookSelector
            textbooks={textbooks}
            value={selectedTextbookId}
            onChange={(value) => void handleTextbookChange(value)}
            loading={textbooksLoading}
            disabled={sending}
          />
        </div>
      </header>

      <div
        ref={scrollRef}
        className="chat-scroll min-h-0 flex-1 overflow-y-auto"
      >
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
          {messages.length === 0 ? (
            <div className="flex min-h-[52vh] flex-col items-center justify-center py-8 text-center">
              <span className="relative flex h-16 w-16 items-center justify-center rounded-3xl border border-brand/25 bg-gradient-to-br from-brand/20 to-cyan-500/10 text-brand-soft">
                <Atom className="h-8 w-8" strokeWidth={1.5} />
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white">
                  <Sparkles className="h-3 w-3" />
                </span>
              </span>

              <h2 className="mt-6 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                What are we solving today?
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
                Ask anything covered in{" "}
                <span className="font-medium text-ink">
                  {selectedTextbook?.title ?? "your indexed textbooks"}
                </span>
                . The tutor answers only from the source and cites the page.
              </p>

              {!textbooksLoading && textbooks.length === 0 ? (
                <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] px-5 py-4 text-left sm:flex-row">
                  <Library className="h-5 w-5 shrink-0 text-amber-300" />
                  <div>
                    <p className="text-xs font-medium text-amber-200">
                      No textbook has been indexed yet
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {user?.role === "admin"
                        ? "Upload a PDF from the admin dashboard to get started."
                        : "Ask an administrator to upload and index the course textbook."}
                    </p>
                  </div>
                  {user?.role === "admin" ? (
                    <Link
                      href="/admin/book"
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-amber-500/25 px-2.5 py-1.5 text-[11px] font-medium text-amber-200 transition hover:bg-amber-500/10"
                    >
                      Upload PDF
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-8 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void handleSend(suggestion)}
                    className="group flex items-start gap-2.5 rounded-xl border border-edge bg-panel/50 px-4 py-3 text-left text-[13px] leading-relaxed text-muted transition hover:border-brand/30 hover:bg-panel/80 hover:text-ink"
                  >
                    <BookOpenCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-soft/70 transition group-hover:text-brand-soft" />
                    <span className="flex-1">{suggestion}</span>
                    <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted/40 transition group-hover:translate-x-0.5 group-hover:text-brand-soft" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {sending ? <TypingIndicator /> : null}
            </div>
          )}
          <div ref={endRef} className="h-1" />
        </div>
      </div>

      <div className="shrink-0 border-t border-edge/60 bg-canvas/70 px-4 pb-4 pt-3 backdrop-blur sm:px-6">
        {error ? (
          <div
            role="alert"
            className="mx-auto mb-2 flex w-full max-w-3xl items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3.5 py-2.5 text-xs leading-relaxed text-rose-200"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              aria-label="Dismiss error"
              className="rounded p-0.5 text-rose-200/70 transition hover:bg-rose-500/10 hover:text-rose-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        <ChatInput
          onSend={handleSend}
          disabled={sending}
          remaining={remaining}
        />
        <p className="mx-auto mt-2 max-w-3xl text-center text-[10px] text-muted/45">
          Physics AI Tutor can make mistakes. Verify important results against
          the cited textbook page.
        </p>
      </div>
    </div>
  );
}
