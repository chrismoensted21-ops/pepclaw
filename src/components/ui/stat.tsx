import { cn } from "@/lib/utils";

interface StatProps {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
  tone?: "default" | "plum" | "muted";
}

export function Stat({ label, value, hint, className, tone = "default" }: StatProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-300">
        {label}
      </span>
      <span
        className={cn(
          "font-serif tabular-nums leading-none",
          tone === "plum"
            ? "text-gradient-plum-soft"
            : tone === "muted"
              ? "text-ink-100"
              : "text-white",
          "text-2xl lg:text-[28px]"
        )}
      >
        {value}
      </span>
      {hint ? <span className="font-mono text-[10px] text-ink-300">{hint}</span> : null}
    </div>
  );
}
