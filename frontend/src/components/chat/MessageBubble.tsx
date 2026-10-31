import { Atom, CheckCheck, Sparkles, UserRound } from "lucide-react";
import { CitationList } from "@/components/chat/CitationList";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";
import { Badge } from "@/components/ui/Badge";
import { cn, formatTime } from "@/lib/utils";
import type { Message } from "@/types";

export function MessageBubble({ message }: { message: Message }) {
  if (message.role === "user") {
    return (
      <div className="flex animate-fade-up justify-end gap-3">
        <div className="flex max-w-[86%] flex-col items-end sm:max-w-[75%]">
          <div
            className={cn(
              "rounded-2xl rounded-br-md bg-brand px-4 py-3 text-sm leading-relaxed text-white shadow-[0_12px_30px_-18px_rgba(99,102,241,0.9)]",
              message.pending && "opacity-70",
            )}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          <span className="mt-1.5 flex items-center gap-1 text-[10px] text-muted/60">
            <UserRound className="h-3 w-3" />
            You · {formatTime(message.createdAt)}
            {message.pending ? " · sending" : ""}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex animate-fade-up gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand via-indigo-500 to-cyan-400 text-white shadow-[0_10px_25px_-14px_rgba(99,102,241,1)]">
        <Atom className="h-4 w-4" strokeWidth={1.8} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-ink">Physics AI Tutor</span>
          <Badge tone="green" className="py-0">
            <CheckCheck className="h-3 w-3" />
            Textbook grounded
          </Badge>
          {message.usage?.cached ? (
            <Badge tone="slate" className="py-0">
              <Sparkles className="h-3 w-3" />
              Cached
            </Badge>
          ) : null}
        </div>

        <div className="rounded-2xl rounded-tl-md border border-edge bg-panel/70 px-4 py-3.5 sm:px-5">
          <MarkdownRenderer content={message.content} />
          <CitationList citations={message.citations} />
        </div>

        <p className="mt-1.5 text-[10px] text-muted/50">
          {formatTime(message.createdAt)}
          {message.usage && !message.usage.cached
            ? ` · ${message.usage.model}`
            : ""}
        </p>
      </div>
    </div>
  );
}
