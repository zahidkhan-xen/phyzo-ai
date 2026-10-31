"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Loader2, Sparkles } from "lucide-react";

export function ChatInput({
  onSend,
  disabled = false,
  remaining,
}: {
  onSend: (message: string) => Promise<boolean>;
  disabled?: boolean;
  remaining?: number | null;
}) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [value]);

  async function submit() {
    const message = value.trim();
    if (!message || disabled || submitting) return;

    setSubmitting(true);
    const accepted = await onSend(message);
    if (accepted) {
      setValue("");
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
    setSubmitting(false);
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="rounded-2xl border border-edge bg-panel/90 p-2 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl transition focus-within:border-brand/40">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                void submit();
              }
            }}
            placeholder="Ask a physics question from your textbook..."
            rows={1}
            maxLength={4000}
            disabled={disabled || submitting}
            className="max-h-[180px] min-h-[42px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-relaxed text-ink placeholder:text-muted/55 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!value.trim() || disabled || submitting}
            aria-label="Send message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:bg-white/8 disabled:text-muted"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-1 pt-1.5">
          <span className="inline-flex items-center gap-1.5 text-[10px] text-muted/60">
            <Sparkles className="h-3 w-3 text-brand-soft/70" />
            Answers limited to your indexed textbook
          </span>
          <span className="text-[10px] text-muted/50">
            {remaining !== null && remaining !== undefined
              ? `${remaining} questions left today · `
              : ""}
            Enter to send · Shift+Enter for a new line
          </span>
        </div>
      </div>
    </div>
  );
}
