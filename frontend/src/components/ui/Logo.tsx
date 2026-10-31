import Link from "next/link";
import { Atom } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  href = "/",
  compact = false,
  className,
}: {
  href?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("group flex items-center gap-2.5", className)}
      aria-label="Physics AI Tutor home"
    >
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand via-indigo-500 to-cyan-400 shadow-[0_8px_24px_-8px_rgba(99,102,241,0.9)]">
        <Atom className="h-5 w-5 text-white" strokeWidth={1.8} />
        <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/25" />
      </span>
      {!compact ? (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            Physics AI Tutor
          </span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
            Textbook grounded
          </span>
        </span>
      ) : null}
    </Link>
  );
}
