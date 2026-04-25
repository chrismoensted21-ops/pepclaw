"use client";

import { Panel } from "@/components/ui/panel";
import { StatusDot } from "@/components/ui/status-dot";
import type { DashboardPayload } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

interface Props {
  swarm: DashboardPayload["swarm"];
  className?: string;
}

export function SwarmGraphPanel({ swarm, className }: Props) {
  return (
    <Panel
      className={className}
      title="Swarm graph"
      bodyClassName="px-3 py-3"
      topRight={
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-300">
          {swarm.totalActive} active · {swarm.totalAgents} total
        </span>
      }
    >
      <ul className="flex flex-col gap-1">
        {swarm.nodes.map((n) => {
          const tone =
            n.tier === "coordinator"
              ? "border-plum-300/30 bg-plum-500/[0.05]"
              : n.tier === "upstream"
                ? "border-plum-500/12"
                : n.tier === "reasoning"
                  ? "border-plum-500/12"
                  : "border-plum-500/12";
          const status =
            n.running > 0
              ? "running"
              : n.failed > 0
                ? "failed"
                : n.completed > 0
                  ? "completed"
                  : "queued";
          return (
            <li
              key={n.pool}
              title={n.desc}
              className={cn(
                "group flex items-center gap-3 rounded-lg border bg-white/[0.012] px-2.5 py-1.5 transition-colors hover:border-plum-400/30 hover:bg-white/[0.03]",
                tone
              )}
            >
              <StatusDot status={status} />
              <span className="min-w-0 flex-1 truncate font-serif text-[14px] leading-tight text-white">
                {n.label}
              </span>
              <span className="hidden shrink-0 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-300 sm:inline">
                {n.tier}
              </span>
              <span className="shrink-0 font-mono text-[10px] tabular-nums text-ink-200">
                <span className="text-plum-300">{n.completed}</span>
                <span className="text-ink-400">/</span>
                <span className="text-ink-300">{n.total}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
