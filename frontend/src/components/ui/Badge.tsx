import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "brand" | "green" | "amber" | "rose" | "slate" | "cyan";

const tones: Record<Tone, string> = {
  brand: "bg-brand/12 text-brand-soft border-brand/25",
  green: "bg-emerald-500/12 text-emerald-300 border-emerald-500/25",
  amber: "bg-amber-500/12 text-amber-300 border-amber-500/25",
  rose: "bg-rose-500/12 text-rose-300 border-rose-500/25",
  slate: "bg-white/6 text-muted border-white/10",
  cyan: "bg-cyan-500/12 text-cyan-300 border-cyan-500/25",
};

export function Badge({
  tone = "slate",
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
