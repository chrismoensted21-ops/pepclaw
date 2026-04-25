"use client";

import { Panel } from "@/components/ui/panel";
import type { DashboardPayload } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

interface Props {
  pipeline: DashboardPayload["pipeline"];
  className?: string;
}

export function PipelinePanel({ pipeline, className }: Props) {
  return (
    <Panel
      className={className}
      title="Research pipeline"
      topRight={
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-300">
          5-layer DAG · 10 stages
        </span>
      }
    >
      <div className="grid grid-cols-5 gap-2 md:grid-cols-10">
        {pipeline.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              "relative flex flex-col gap-1.5 rounded-sm border px-2 py-3",
              s.complete
                ? "border-plum-300/30 bg-plum-300/[0.03]"
                : s.active
                  ? "border-plum-300/40 bg-plum-300/[0.05]"
                  : "border-white/5 bg-white/[0.02]"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] tracking-widest text-ink-300">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className={cn(
                  "font-mono text-[10px] tabular-nums",
                  s.complete
                    ? "text-plum-300"
                    : s.active
                      ? "text-plum-200"
                      : "text-ink-300"
                )}
              >
                {s.pct}%
              </span>
            </div>
            <span className="font-serif text-[14px] leading-tight text-ink-50">{s.label}</span>
            <span className="font-mono text-[9.5px] uppercase tracking-widest text-ink-300 truncate">
              {s.count}
            </span>
            <div className="mt-1 h-[2px] w-full overflow-hidden rounded-full bg-white/5">
              <div
                className={cn(
                  "h-full",
                  s.complete
                    ? "bg-plum-300"
                    : s.active
                      ? "bg-plum-300"
                      : "bg-white/10"
                )}
                style={{ width: `${s.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
