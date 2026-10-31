import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div className={cn("flex items-center justify-center gap-2 text-muted", className)}>
      <Loader2 className="h-5 w-5 animate-spin text-brand-soft" />
      {label ? <span className="text-sm">{label}</span> : null}
    </div>
  );
}

export function FullPageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <Spinner label={label} />
    </div>
  );
}
