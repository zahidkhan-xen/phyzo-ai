"use client";

import { BookOpen, ChevronDown } from "lucide-react";
import type { Textbook } from "@/types";

export function TextbookSelector({
  textbooks,
  value,
  onChange,
  disabled = false,
  loading = false,
}: {
  textbooks: Textbook[];
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="relative">
      <BookOpen className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-soft" />
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
        disabled={disabled || loading || textbooks.length === 0}
        aria-label="Textbook scope"
        className="h-9 max-w-[220px] appearance-none truncate rounded-lg border border-edge bg-panel-soft/80 pl-8 pr-8 text-xs font-medium text-ink transition hover:border-brand/40 focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-60 sm:max-w-[280px]"
      >
        <option value="">All textbooks</option>
        {textbooks.map((textbook) => (
          <option key={textbook.id} value={textbook.id}>
            {textbook.title}
            {textbook.grade ? ` · ${textbook.grade}` : ""}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
    </div>
  );
}
