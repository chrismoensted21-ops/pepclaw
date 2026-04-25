"use client";

import { Panel } from "@/components/ui/panel";
import { GradePill } from "@/components/ui/grade-pill";
import type { DashboardPayload } from "@/lib/dashboard";

interface Props {
  findings: DashboardPayload["feeds"]["findings"];
  className?: string;
}

export function FindingsFeedPanel({ findings, className }: Props) {
  return (
    <Panel
      className={className}
      title="Findings feed"
      topRight={
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-300">
          {findings.length} latest
        </span>
      }
    >
      {findings.length === 0 ? (
        <div className="py-10 text-center font-mono text-[11px] uppercase tracking-widest text-ink-300">
          No findings yet for the live mission
        </div>
      ) : (
        <ul className="max-h-[440px] space-y-2 overflow-y-auto pr-1 scrollbar-thin">
          {findings.map((f) => (
            <li
              key={f.id}
              className="rounded-sm border border-white/5 bg-black/20 p-3 hover:border-white/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <GradePill grade={f.evidence_grade} />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-ink-300 truncate">
                    {f.source_ref}
                  </span>
                </div>
                {f.url ? (
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[10px] uppercase tracking-widest text-plum-200 hover:text-plum-100"
                  >
                    open ↗
                  </a>
                ) : null}
              </div>
              {f.title ? (
                <div className="mt-1.5 font-serif text-[15px] leading-snug text-ink-50">
                  {f.title}
                </div>
              ) : null}
              <p className="mt-1.5 line-clamp-3 text-[12px] leading-relaxed text-ink-300">
                {f.excerpt}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
