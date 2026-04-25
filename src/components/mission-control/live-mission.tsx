"use client";

import { Panel } from "@/components/ui/panel";
import { StatusDot } from "@/components/ui/status-dot";
import { Stat } from "@/components/ui/stat";
import { cn, formatDuration } from "@/lib/utils";
import type { DashboardPayload } from "@/lib/dashboard";

interface Props {
  mission: DashboardPayload["liveMission"];
  summary: DashboardPayload["summary"];
  className?: string;
}

export function LiveMissionPanel({ mission, summary, className }: Props) {
  return (
    <Panel
      className={className}
      title="Live mission"
      topRight={
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-300">
          <StatusDot status={mission?.status ?? "queued"} /> {mission?.status ?? "queued"}
        </span>
      }
    >
      {!mission ? (
        <EmptyMission />
      ) : (
        <div className="space-y-6">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-plum-200/80">
              {mission.id}
            </div>
            <h2 className="mt-2 font-serif text-2xl leading-tight text-ink-50 lg:text-[28px]">
              {mission.query}
            </h2>
            {mission.target_class ? (
              <div className="mt-1 font-mono text-[11px] uppercase tracking-widest text-ink-300">
                target class · {mission.target_class}
              </div>
            ) : null}
            <div className="mt-3 font-mono text-[11px] text-ink-300">{mission.stage}</div>
          </div>

          <div>
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-ink-300">
              <span>Pipeline progress</span>
              <span className="text-ink-100">{mission.progress_pct}%</span>
            </div>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full bg-gradient-to-r from-plum-500 via-plum-300 to-plum-100 transition-all duration-500"
                style={{ width: `${mission.progress_pct}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
            <Stat label="Wall time" value={formatDuration(mission.wall_seconds)} />
            <Stat label="Depth" value={mission.depth} tone="muted" />
            <Stat
              label="Spent / budget"
              value={`$${(mission.spent_cents / 100).toFixed(2)} / $${(mission.budget_cents / 100).toFixed(0)}`}
              tone="muted"
            />
            <Stat label="Active agents" value={summary.active_agents} tone="plum" />
          </div>

          <div className="rounded-sm border border-white/5 bg-black/30 p-4 font-mono text-[11px] text-ink-300">
            <div className="flex items-center justify-between gap-3">
              <span className="uppercase tracking-widest">Prediction commit · sha-256</span>
              {mission.revealed_at ? (
                <span className="text-plum-300">revealed</span>
              ) : (
                <span className="text-plum-200">sealed</span>
              )}
            </div>
            <div className="mt-2 truncate text-ink-200">
              {mission.commit_hash ?? "—"}
            </div>
            {mission.commit_salt ? (
              <div className="mt-2 truncate text-ink-300">
                <span className="text-ink-200">salt:</span> {mission.commit_salt}
              </div>
            ) : (
              <div className="mt-2 text-ink-400">salt withheld until completion</div>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}

function EmptyMission() {
  return (
    <div className={cn("py-12 text-center")}>
      <div className="font-mono text-[10px] uppercase tracking-widest text-ink-300">
        No mission selected
      </div>
      <div className="mt-3 font-serif text-xl text-ink-100">
        Start a mission to spin up the swarm.
      </div>
      <div className="mt-2 text-sm text-ink-300">
        Use the &ldquo;New mission&rdquo; button in the header above.
      </div>
    </div>
  );
}
