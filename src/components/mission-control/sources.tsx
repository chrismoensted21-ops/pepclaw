"use client";

import { Panel } from "@/components/ui/panel";
import { StatusDot } from "@/components/ui/status-dot";
import type { DashboardPayload } from "@/lib/dashboard";

interface Props {
  sources: DashboardPayload["sources"];
  className?: string;
}

export function SourcesPanel({ sources, className }: Props) {
  return (
    <Panel
      className={className}
      title="Data sources"
      topRight={
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-300">
          live ingestion
        </span>
      }
    >
      <ul className="grid grid-cols-2 gap-2">
        {sources.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between gap-3 rounded-sm border border-white/5 bg-black/20 px-3 py-2.5"
          >
            <span className="flex items-center gap-2 min-w-0">
              <StatusDot status={s.status} />
              <span className="truncate font-serif text-[15px] text-ink-50">{s.label}</span>
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-300">
              {s.count}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
