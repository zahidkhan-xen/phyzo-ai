"use client";

import { BookOpenCheck, ChevronDown, FileText } from "lucide-react";
import type { Citation } from "@/types";

export function CitationList({ citations }: { citations: Citation[] }) {
  if (citations.length === 0) return null;

  return (
    <details className="group mt-4 rounded-xl border border-edge bg-canvas-soft/60" open={citations.length <= 2}>
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3.5 py-2.5 text-xs font-medium text-muted transition hover:text-ink [&::-webkit-details-marker]:hidden">
        <BookOpenCheck className="h-4 w-4 text-cyan-300" />
        <span>
          Sources from your textbook
          <span className="ml-1.5 rounded-full bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-300">
            {citations.length}
          </span>
        </span>
        <ChevronDown className="ml-auto h-3.5 w-3.5 transition group-open:rotate-180" />
      </summary>

      <div className="space-y-2 border-t border-edge/70 p-2.5">
        {citations.map((citation, index) => (
          <div
            key={`${citation.chunkId}-${index}`}
            className="rounded-lg border border-edge/70 bg-panel/60 p-3"
          >
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand-soft">
                <FileText className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="truncate text-xs font-medium text-ink">
                    {citation.textbookTitle}
                  </p>
                  <span className="rounded-full border border-brand/20 bg-brand/10 px-2 py-0.5 text-[10px] font-medium text-brand-soft">
                    page {citation.pageNumber}
                  </span>
                  <span className="ml-auto text-[10px] text-muted/60">
                    {Math.round(citation.score * 100)}% match
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-3 text-[11px] leading-relaxed text-muted">
                  {citation.excerpt}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}
