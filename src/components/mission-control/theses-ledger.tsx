"use client";

import { Panel } from "@/components/ui/panel";
import { GradePill } from "@/components/ui/grade-pill";
import type { DashboardPayload } from "@/lib/dashboard";

interface Props {
  theses: DashboardPayload["feeds"]["theses"];
  className?: string;
}

export function ThesesLedgerPanel({ theses, className }: Props) {
  return (
    <Panel
      className={className}
      title="Thesis ledger"
      topRight={
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-300">
          {theses.length} drafts
        </span>
      }
    >
      {theses.length === 0 ? (
        <div className="py-10 text-center font-mono text-[11px] uppercase tracking-widest text-ink-300">
          No theses produced yet
        </div>
      ) : (
        <ul className="max-h-[440px] space-y-3 overflow-y-auto pr-1 scrollbar-thin">
          {theses.map((t) => (
            <li
              key={t.id}
              className="rounded-sm border border-white/5 bg-black/20 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <GradePill grade={t.evidence_grade} />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-ink-300">
                    conviction {t.conviction?.toFixed(2) ?? "?"}
                  </span>
                </div>
                <span
                  className={
                    "font-mono text-[10px] uppercase tracking-widest " +
                    (t.status === "blocked"
                      ? "text-red-300"
                      : t.status === "qa_pending"
                        ? "text-plum-200"
                        : "text-ink-300")
                  }
                >
                  {t.status}
                </span>
              </div>
              <h4 className="mt-2 font-serif text-[16px] leading-snug text-ink-50">{t.title}</h4>
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink-200 line-clamp-4">
                {t.hypothesis}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
