"use client";

import { useEffect, useState, useCallback } from "react";
import type { DashboardPayload } from "@/lib/dashboard";
import { HeaderBar } from "./header-bar";
import { LiveMissionPanel } from "./live-mission";
import { SwarmGraphPanel } from "./swarm-graph";
import { PipelinePanel } from "./pipeline";
import { EvidencePanel } from "./evidence";
import { SourcesPanel } from "./sources";
import { DeliverablesPanel } from "./deliverables";
import { RecentRunsPanel } from "./recent-runs";
import { FindingsFeedPanel } from "./findings-feed";
import { ThesesLedgerPanel } from "./theses-ledger";
import { CritiquesPanel } from "./critiques";
import { DossierPreviewPanel } from "./dossier-preview";
import { NewMissionDialog } from "./new-mission-dialog";

interface Props {
  initial: DashboardPayload;
}

export function MissionControl({ initial }: Props) {
  const [data, setData] = useState<DashboardPayload>(initial);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const focus = data.liveMission?.id;
      const res = await fetch(`/api/dashboard${focus ? `?mission_id=${focus}` : ""}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const j = (await res.json()) as DashboardPayload;
        setData(j);
      }
    } finally {
      setRefreshing(false);
    }
  }, [data.liveMission?.id]);

  // SSE-driven refresh: any swarm event triggers a fast re-fetch.
  useEffect(() => {
    const focus = data.liveMission?.id;
    const url = `/api/stream${focus ? `?mission_id=${focus}` : ""}`;
    const es = new EventSource(url);
    let pending = false;
    const debouncedRefresh = () => {
      if (pending) return;
      pending = true;
      setTimeout(() => {
        pending = false;
        void refresh();
      }, 350);
    };
    es.onmessage = (msg) => {
      try {
        const j = JSON.parse(msg.data) as { type: string };
        if (j.type === "event") debouncedRefresh();
      } catch {
        /* ignore */
      }
    };
    es.onerror = () => {
      es.close();
    };
    const interval = setInterval(refresh, 8000);
    return () => {
      es.close();
      clearInterval(interval);
    };
  }, [data.liveMission?.id, refresh]);

  return (
    <div className="container py-6 lg:py-8 space-y-4 lg:space-y-5">
      <HeaderBar header={data.header} refreshing={refreshing} onRefresh={refresh}>
        <NewMissionDialog onStarted={refresh} />
      </HeaderBar>

      <div className="grid gap-4 lg:gap-5 grid-cols-12 [&>*]:min-w-0">
        <LiveMissionPanel
          mission={data.liveMission}
          summary={data.summary}
          className="col-span-12 xl:col-span-7"
        />
        <SwarmGraphPanel swarm={data.swarm} className="col-span-12 xl:col-span-5" />

        <PipelinePanel pipeline={data.pipeline} className="col-span-12" />

        <EvidencePanel evidence={data.evidence} className="col-span-12 xl:col-span-7" />
        <SourcesPanel sources={data.sources} className="col-span-12 xl:col-span-5" />

        <FindingsFeedPanel findings={data.feeds.findings} className="col-span-12 xl:col-span-7" />
        <ThesesLedgerPanel theses={data.feeds.theses} className="col-span-12 xl:col-span-5" />

        <CritiquesPanel critiques={data.feeds.critiques} className="col-span-12 xl:col-span-5" />
        <DossierPreviewPanel dossiers={data.feeds.dossiers} className="col-span-12 xl:col-span-7" />

        <DeliverablesPanel deliverables={data.deliverables} className="col-span-12 xl:col-span-5" />
        <RecentRunsPanel runs={data.recentRuns} className="col-span-12 xl:col-span-7" />
      </div>
    </div>
  );
}
