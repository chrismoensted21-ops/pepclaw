"use client";

import { Panel } from "@/components/ui/panel";
import type { DashboardPayload } from "@/lib/dashboard";

interface Props {
  dossiers: DashboardPayload["feeds"]["dossiers"];
  className?: string;
}

export function DossierPreviewPanel({ dossiers, className }: Props) {
  const latest = dossiers[0];
  return (
    <Panel
      className={className}
      title="Dossier preview"
      topRight={
        latest ? (
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-300">
            {latest.content_chars.toLocaleString()} chars · {latest.doc_type}
          </span>
        ) : null
      }
    >
      {!latest ? (
        <div className="py-10 text-center font-mono text-[11px] uppercase tracking-widest text-ink-300">
          No dossier produced yet
        </div>
      ) : (
        <article>
          <h4 className="font-serif text-[18px] text-ink-50">{latest.title}</h4>
          <pre className="mt-3 max-h-[360px] overflow-y-auto whitespace-pre-wrap rounded-sm border border-white/5 bg-black/40 p-4 font-mono text-[11.5px] leading-relaxed text-ink-200 scrollbar-thin">
            {latest.preview}
          </pre>
        </article>
      )}
    </Panel>
  );
}
