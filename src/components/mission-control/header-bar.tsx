"use client";

import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
import type { DashboardPayload } from "@/lib/dashboard";
import type { ReactNode } from "react";

interface Props {
  header: DashboardPayload["header"];
  refreshing: boolean;
  onRefresh: () => void;
  children?: ReactNode;
}

export function HeaderBar({ header, refreshing, onRefresh, children }: Props) {
  return (
    <header className="panel flex flex-wrap items-center justify-between gap-4 px-6 py-5">
      <div className="flex items-center gap-6 min-w-0">
        <div>
          <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-plum-300">
            <span className="h-px w-6 bg-plum-500/40" />
            Mission Control
          </span>
          <div className="mt-2 font-serif text-[28px] text-white leading-none">
            Live operations
          </div>
        </div>
        <div className="hidden lg:flex flex-wrap items-center gap-x-5 gap-y-1.5 border-l border-plum-500/15 pl-6 text-[10.5px] font-mono uppercase tracking-[0.20em]">
          <span className="text-ink-300">{header.timestamp}</span>
          <span className="flex items-center gap-2 text-ink-100">
            <StatusDot status="live" /> {header.status}
          </span>
          <span className="text-ink-300">env · {header.environment}</span>
          <span className="text-ink-300">region · {header.region}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? "Refreshing…" : "Refresh"}
        </Button>
        {children}
      </div>
    </header>
  );
}
