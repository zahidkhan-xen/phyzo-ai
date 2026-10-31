import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className="space-y-1.5">
        {label ? (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-ink"
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-11 w-full rounded-xl border border-edge bg-canvas-soft/80 px-3.5 text-sm text-ink placeholder:text-muted/55 transition focus:border-brand/60 focus:bg-canvas-soft focus:outline-none focus:ring-2 focus:ring-brand/20",
            error && "border-rose-500/50 focus:border-rose-400/70 focus:ring-rose-500/15",
            className,
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-rose-300">{error}</p>
        ) : hint ? (
          <p className="text-xs text-muted">{hint}</p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
