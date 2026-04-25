"use client";

import { Panel } from "@/components/ui/panel";
import { Stat } from "@/components/ui/stat";
import type { DashboardPayload } from "@/lib/dashboard";

interface Props {
  evidence: DashboardPayload["evidence"];
  className?: string;
}

export function EvidencePanel({ evidence, className }: Props) {
  return (
    <Panel
      className={className}
      title="Evidence"
      topRight={
        <span className="font-mono text-[10px] uppercase tracking-widest text-plum-200">
          coverage {evidence.coverage_pct}%
        </span>
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="grid grid-cols-2 gap-4">
          {evidence.metrics.map((m) => (
            <Stat key={m.label} label={m.label} value={m.value} />
          ))}
        </div>
        <div className="space-y-5">
          <Bars title="Source mix" rows={evidence.source_mix} accent="gold" />
          <Bars title="Confidence distribution" rows={evidence.confidence} accent="emerald" />
        </div>
      </div>
    </Panel>
  );
}

function Bars({
  title,
  rows,
  accent,
}: {
  title: string;
  rows: { label: string; pct: number }[];
  accent: "gold" | "emerald";
}) {
  return (
    <div>
      <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-300">
        {title}
      </div>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3">
            <span className="w-24 shrink-0 font-mono text-[11px] text-ink-200">{r.label}</span>
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
              <div
                className={
                  accent === "gold"
                    ? "h-full bg-gradient-to-r from-plum-500/70 to-plum-200"
                    : "h-full bg-gradient-to-r from-plum-500/70 to-plum-200"
                }
                style={{ width: `${r.pct}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right font-mono text-[11px] tabular-nums text-ink-200">
              {r.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
