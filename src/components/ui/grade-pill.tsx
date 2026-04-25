import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  A: "border-plum-300/40 text-plum-100 bg-plum-500/10",
  B: "border-plum-400/35 text-plum-200 bg-plum-600/8",
  C: "border-plum-500/25 text-plum-300 bg-plum-700/8",
  D: "border-fuchsia-400/25 text-fuchsia-200 bg-fuchsia-500/5",
  X: "border-rose-400/35 text-rose-200 bg-rose-500/5",
};

export function GradePill({ grade }: { grade: string | null | undefined }) {
  const g = (grade ?? "?").toUpperCase();
  const tone = TONE[g] ?? "border-white/10 text-ink-200 bg-white/[0.02]";
  return (
    <span
      className={cn(
        "inline-flex h-5 w-5 items-center justify-center rounded-md border font-serif text-[12px] tabular-nums",
        tone
      )}
      title={`Evidence grade ${g}`}
    >
      {g}
    </span>
  );
}
