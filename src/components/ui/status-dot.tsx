import { cn } from "@/lib/utils";

const COLORS: Record<string, string> = {
  live: "bg-plum-300",
  running: "bg-plum-300",
  completed: "bg-plum-200",
  pending: "bg-fuchsia-300",
  warning: "bg-fuchsia-300",
  failed: "bg-rose-400",
  err: "bg-rose-400",
  future: "bg-ink-400",
  queued: "bg-ink-300",
  paused: "bg-sky-300",
};

export function StatusDot({
  status,
  className,
  glow = true,
}: {
  status: string;
  className?: string;
  glow?: boolean;
}) {
  const c = COLORS[status] ?? "bg-ink-300";
  return (
    <span
      className={cn(
        "inline-block h-1.5 w-1.5 rounded-full",
        c,
        glow && "shadow-[0_0_10px_currentColor]",
        status === "running" || status === "live" ? "animate-pulse-soft" : null,
        className
      )}
    />
  );
}
