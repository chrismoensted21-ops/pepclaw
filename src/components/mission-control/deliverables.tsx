"use client";

import { Panel } from "@/components/ui/panel";
import type { DashboardPayload } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

interface Props {
  deliverables: DashboardPayload["deliverables"];
  className?: string;
}

export function DeliverablesPanel({ deliverables, className }: Props) {
  return (
    <Panel className={className} title="Deliverables">
      <ul className="divide-y divide-white/5">
        {deliverables.map((d) => (
          <li key={d.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <div className="font-serif text-[15px] text-ink-50">{d.name}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-300">
                {d.detail}
              </div>
            </div>
            <span
              className={cn(
                "font-mono text-[9.5px] uppercase tracking-widest",
                d.status === "COMPLETE"
                  ? "text-plum-300"
                  : d.status === "REVIEW"
                    ? "text-plum-200"
                    : d.status === "INDEXED"
                      ? "text-fuchsia-300"
                      : "text-ink-300"
              )}
            >
              {d.status}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
