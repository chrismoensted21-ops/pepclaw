"use client";

import { Panel } from "@/components/ui/panel";
import type { DashboardPayload } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

interface Props {
  critiques: DashboardPayload["feeds"]["critiques"];
  className?: string;
}

const PERSONA_LABEL: Record<string, string> = {
  skeptic: "Skeptic",
  scientist: "Scientist",
  senior_reviewer: "Senior Reviewer",
};

export function CritiquesPanel({ critiques, className }: Props) {
  return (
    <Panel
      className={className}
      title="Red team"
      topRight={
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-300">
          {critiques.length} critiques
        </span>
      }
    >
      {critiques.length === 0 ? (
        <div className="py-10 text-center font-mono text-[11px] uppercase tracking-widest text-ink-300">
          No critiques yet
        </div>
      ) : (
        <ul className="max-h-[440px] space-y-2 overflow-y-auto pr-1 scrollbar-thin">
          {critiques.map((c) => (
            <li
              key={c.id}
              className={cn(
                "rounded-sm border bg-black/20 p-3",
                c.blocks
                  ? "border-red-400/40"
                  : c.severity === "warning"
                    ? "border-plum-300/30"
                    : "border-white/5"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] uppercase tracking-widest text-plum-200/80">
                  {PERSONA_LABEL[c.persona] ?? c.persona}
                </span>
                <span
                  className={cn(
                    "font-mono text-[10px] uppercase tracking-widest",
                    c.blocks
                      ? "text-red-300"
                      : c.severity === "warning"
                        ? "text-plum-200"
                        : "text-ink-300"
                  )}
                >
                  {c.blocks ? "BLOCK" : c.severity}
                </span>
              </div>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-200">
                {c.specific_concern}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
