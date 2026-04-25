"use client";

import { Panel } from "@/components/ui/panel";
import { StatusDot } from "@/components/ui/status-dot";
import type { DashboardPayload } from "@/lib/dashboard";

interface Props {
  runs: DashboardPayload["recentRuns"];
  className?: string;
}

export function RecentRunsPanel({ runs, className }: Props) {
  return (
    <Panel className={className} title="Recent runs">
      {runs.length === 0 ? (
        <div className="py-10 text-center font-mono text-[11px] uppercase tracking-widest text-ink-300">
          No missions yet
        </div>
      ) : (
        <ul className="divide-y divide-white/5">
          {runs.map((r) => (
            <li
              key={r.id}
              className="grid grid-cols-[auto,minmax(0,1fr),auto] items-start gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[auto,minmax(0,1fr),auto,auto] sm:gap-4"
            >
              <StatusDot status={r.status} className="mt-2" />
              <div className="min-w-0">
                <div className="truncate font-serif text-[15px] text-ink-50">{r.name}</div>
                <div className="truncate font-mono text-[10px] uppercase tracking-widest text-ink-300">
                  {r.id}
                </div>
              </div>
              <div className="whitespace-nowrap text-right font-mono text-[11px] text-ink-200">
                {r.duration}
              </div>
              <div className="col-span-2 text-right font-mono text-[10px] uppercase tracking-widest text-ink-300 sm:col-span-1 sm:whitespace-nowrap">
                {r.timestamp}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
