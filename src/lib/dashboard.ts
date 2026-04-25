/**
 * Shapes the persisted swarm state into a dashboard payload that mirrors the
 * panel structure of /app. One pass over Supabase, one aggregated view.
 */
import {
  dashboardSummary,
  listMissions,
  listFindings,
  listTheses,
  listCritiques,
  listDossiers,
  poolStats,
  getMission,
  type DashboardSummary,
} from "./repo";
import { ALL_POOLS, POOL_DESC, POOL_LABEL, POOL_TIER, type AgentPool } from "./types";
import { formatDuration, formatRelativeUtc, nowUtcLabel } from "./utils";

export interface DashboardPayload {
  header: { timestamp: string; status: string; environment: string; region: string };
  summary: DashboardSummary;
  liveMission: LiveMissionView | null;
  swarm: SwarmGraph;
  pipeline: PipelineStage[];
  evidence: EvidenceView;
  deliverables: DeliverableRow[];
  recentRuns: RecentRunRow[];
  sources: SourceNode[];
  feeds: { findings: FindingRow[]; theses: ThesisRow[]; critiques: CritiqueRow[]; dossiers: DossierRow[] };
}

export interface LiveMissionView {
  id: string;
  query: string;
  target_class: string | null;
  status: string;
  depth: string;
  progress_pct: number;
  stage: string;
  wall_seconds: number | null;
  budget_cents: number;
  spent_cents: number;
  commit_hash: string | null;
  commit_salt: string | null;
  revealed_at: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface SwarmNode {
  pool: AgentPool | "orchestrator";
  label: string;
  desc: string;
  tier: "coordinator" | "upstream" | "reasoning" | "output";
  total: number;
  completed: number;
  running: number;
  failed: number;
  isCenter?: boolean;
}

export interface SwarmGraph {
  nodes: SwarmNode[];
  totalActive: number;
  totalAgents: number;
}

export interface PipelineStage {
  id: string;
  label: string;
  pct: number;
  count: string;
  active?: boolean;
  complete?: boolean;
}

export interface EvidenceView {
  coverage_pct: number;
  metrics: { label: string; value: string }[];
  source_mix: { label: string; pct: number }[];
  confidence: { label: string; pct: number }[];
}

export interface DeliverableRow {
  id: string;
  name: string;
  status: string;
  detail: string;
}

export interface RecentRunRow {
  id: string;
  name: string;
  timestamp: string;
  duration: string;
  output: string;
  status: "success" | "warning" | "failed";
}

export interface SourceNode {
  id: string;
  label: string;
  status: "live" | "pending" | "future";
  count: string;
}

export interface FindingRow {
  id: string;
  pool: AgentPool;
  source_ref: string;
  title: string | null;
  url: string | null;
  evidence_grade: string | null;
  excerpt: string;
}
export interface ThesisRow {
  id: string;
  title: string;
  hypothesis: string;
  evidence_grade: string | null;
  conviction: number | null;
  status: string;
}
export interface CritiqueRow {
  id: string;
  thesis_id: string | null;
  persona: string;
  severity: string;
  specific_concern: string;
  blocks: boolean;
}
export interface DossierRow {
  id: string;
  title: string;
  doc_type: string;
  content_chars: number;
  preview: string;
  created_at: string;
}

export async function buildDashboard(focusMissionId?: string | null): Promise<DashboardPayload> {
  const [summary, allMissions, ps] = await Promise.all([
    dashboardSummary(),
    listMissions(50),
    poolStats(),
  ]);
  const focus = focusMissionId
    ? await getMission(focusMissionId)
    : allMissions.find((m) => m.status === "running") ?? allMissions[0] ?? null;

  const psByPool = new Map(ps.map((p) => [p.pool, p]));

  const swarmNodes: SwarmNode[] = [
    {
      pool: "orchestrator",
      label: "Orchestrator",
      desc: "Builds the 5-layer DAG, dispatches tasks across pools, enforces budget + circuit breakers.",
      tier: "coordinator",
      total: 1,
      completed: 0,
      running: focus?.status === "running" ? 1 : 0,
      failed: 0,
      isCenter: true,
    },
    ...ALL_POOLS.map((p) => {
      const stats = psByPool.get(p);
      return {
        pool: p,
        label: POOL_LABEL[p],
        desc: POOL_DESC[p],
        tier: POOL_TIER[p],
        total: stats?.total ?? 0,
        completed: stats?.completed ?? 0,
        running: stats?.running ?? 0,
        failed: stats?.failed ?? 0,
      };
    }),
  ];

  const totalActive = swarmNodes.reduce((acc, n) => acc + n.running, 0);
  const totalAgents = swarmNodes.reduce((acc, n) => acc + n.total, 0);

  // Pipeline stages
  const pickPct = (pools: AgentPool[]): { pct: number; completed: number; total: number } => {
    let total = 0,
      completed = 0;
    for (const p of pools) {
      const s = psByPool.get(p);
      total += s?.total ?? 0;
      completed += s?.completed ?? 0;
    }
    return { pct: total ? Math.round((completed / total) * 100) : 0, completed, total };
  };

  const ingest = pickPct([
    "literature_miner",
    "sequence_structure",
    "target_pathway",
    "variant_linker",
  ]);
  const annotate = pickPct(["admet_developability"]);
  const grade = pickPct(["evidence_grader"]);
  const novelty = pickPct(["novelty_scout", "patent_competitive"]);
  const thesis = pickPct(["thesis_generator"]);
  const redteam = pickPct(["red_team"]);
  const synth = pickPct(["synthesizer"]);
  const draft = pickPct(["dossier_assembler"]);
  const allFindings = focus ? await listFindings(focus.id) : [];
  const aOrB = allFindings.filter((f) => f.evidence_grade === "A" || f.evidence_grade === "B").length;
  const dossiersList = focus ? await listDossiers(focus.id) : [];
  const deliveredDossiers = dossiersList.filter((d) => d.doc_type === "dossier").length;

  const pipeline: PipelineStage[] = [
    { id: "ingest", label: "Ingest", pct: ingest.pct, count: `${ingest.completed} tasks` },
    { id: "annotate", label: "Annotate", pct: annotate.pct, count: `${annotate.completed} cards` },
    { id: "novelty", label: "Novelty", pct: novelty.pct, count: `${novelty.completed} signals` },
    { id: "grade", label: "Grade", pct: grade.pct, count: `${grade.completed} graded` },
    { id: "thesis", label: "Thesis", pct: thesis.pct, count: `${thesis.completed} drafts` },
    { id: "redteam", label: "Red Team", pct: redteam.pct, count: `${redteam.completed} critiques` },
    { id: "synth", label: "Synthesize", pct: synth.pct, count: `${synth.completed} docs` },
    { id: "draft", label: "Draft", pct: draft.pct, count: `${draft.completed} dossiers` },
    { id: "qa", label: "QA Gate", pct: aOrB > 0 ? 100 : 0, count: `${aOrB} A/B theses` },
    { id: "deliver", label: "Deliver", pct: deliveredDossiers > 0 ? 100 : 0, count: `${deliveredDossiers} delivered` },
  ];
  for (let i = 0; i < pipeline.length; i++) {
    if (pipeline[i].pct < 100) {
      pipeline[i].active = true;
      break;
    }
  }
  for (const s of pipeline) if (s.pct >= 100) s.complete = true;

  const liveMission: LiveMissionView | null = focus
    ? {
        id: focus.id,
        query: focus.query,
        target_class: focus.target_class,
        status: focus.status,
        depth: focus.depth,
        progress_pct: pipelineProgress(pipeline),
        stage: stageLabel(pipeline, focus.status),
        wall_seconds: focus.completed_at && focus.started_at
          ? Math.round((new Date(focus.completed_at).getTime() - new Date(focus.started_at).getTime()) / 1000)
          : focus.started_at
            ? Math.round((Date.now() - new Date(focus.started_at).getTime()) / 1000)
            : null,
        budget_cents: focus.budget_cents,
        spent_cents: focus.spent_cents,
        commit_hash: focus.commit_hash,
        commit_salt: focus.commit_salt,
        revealed_at: focus.revealed_at,
        started_at: focus.started_at,
        completed_at: focus.completed_at,
      }
    : null;

  // Evidence panel
  const totalGraded =
    summary.grade_a_findings +
    summary.grade_b_findings +
    summary.grade_c_findings +
    summary.grade_d_findings +
    summary.grade_x_findings;
  const coverage = totalGraded
    ? Math.round(
        ((summary.grade_a_findings + summary.grade_b_findings + summary.grade_c_findings) /
          totalGraded) *
          100
      )
    : 0;
  const evidence: EvidenceView = {
    coverage_pct: coverage,
    metrics: [
      { label: "Findings across all missions", value: String(summary.total_findings) },
      { label: "Grade A evidence", value: String(summary.grade_a_findings) },
      { label: "Theses produced", value: String(summary.total_theses) },
      { label: "Red-team critiques", value: String(summary.total_critiques) },
    ],
    source_mix: sourceMix(allFindings),
    confidence: confidenceMix(summary),
  };

  // Deliverables (focus mission)
  const focusTheses = focus ? await listTheses(focus.id) : [];
  const focusCritiques = focus ? await listCritiques(focus.id) : [];
  const synthDocs = dossiersList.filter((d) => d.doc_type === "synthesis");
  const dossiersOnly = dossiersList.filter((d) => d.doc_type === "dossier");
  const deliverables: DeliverableRow[] = [
    {
      id: "dossier",
      name: "Buyer-safe dossier (markdown)",
      status: dossiersOnly[0] ? "COMPLETE" : "QUEUED",
      detail: dossiersOnly[0] ? `${dossiersOnly[0].content_chars} chars` : "awaiting next mission",
    },
    {
      id: "synthesis",
      name: "Synthesis document",
      status: synthDocs[0] ? "COMPLETE" : "QUEUED",
      detail: synthDocs[0] ? `${synthDocs[0].content_chars} chars` : "—",
    },
    {
      id: "theses",
      name: "Thesis records",
      status: focusTheses.length > 0 ? "REVIEW" : "QUEUED",
      detail: `${focusTheses.length} theses · ${aOrB} graded A/B`,
    },
    {
      id: "critiques",
      name: "Red-team critique pack",
      status: focusCritiques.length > 0 ? "COMPLETE" : "QUEUED",
      detail: `${focusCritiques.length} critiques`,
    },
    {
      id: "citations",
      name: "PMID citation map",
      status: summary.pubmed_findings > 0 ? "INDEXED" : "QUEUED",
      detail: `${summary.pubmed_findings} PubMed references`,
    },
  ];

  // Recent runs
  const recentRuns: RecentRunRow[] = allMissions.slice(0, 8).map((m) => {
    const wall =
      m.completed_at && m.started_at
        ? Math.round((new Date(m.completed_at).getTime() - new Date(m.started_at).getTime()) / 1000)
        : null;
    return {
      id: m.id,
      name: (m.query || "Mission").slice(0, 60) + ((m.query?.length ?? 0) > 60 ? "…" : ""),
      timestamp: formatRelativeUtc(m.completed_at ?? m.started_at ?? m.created_at),
      duration: formatDuration(wall),
      output: `${m.status}`,
      status:
        m.status === "completed" ? "success" : m.status === "failed" ? "failed" : "warning",
    };
  });

  const sources: SourceNode[] = [
    { id: "pubmed", label: "PubMed", status: "live", count: `${summary.pubmed_findings} cited` },
    { id: "uniprot", label: "UniProt", status: "live", count: "live" },
    { id: "alphafold", label: "AlphaFold", status: "live", count: "live" },
    { id: "opentargets", label: "OpenTargets", status: "live", count: "live" },
    { id: "chembl", label: "ChEMBL", status: "live", count: "live" },
    { id: "reactome", label: "Reactome", status: "live", count: "live" },
    { id: "lens", label: "Lens.org", status: "pending", count: "pending" },
    { id: "ctgov", label: "ClinicalTrials", status: "future", count: "future" },
  ];

  // Feeds
  const focusFindings = allFindings.slice(-30).reverse();
  const findings: FindingRow[] = focusFindings.map((f) => ({
    id: f.id,
    pool: f.pool,
    source_ref: f.source_ref,
    title: f.title,
    url: f.url,
    evidence_grade: f.evidence_grade,
    excerpt: f.content.slice(0, 220) + (f.content.length > 220 ? "…" : ""),
  }));

  const theses: ThesisRow[] = focusTheses.map((t) => ({
    id: t.id,
    title: t.title,
    hypothesis: t.hypothesis,
    evidence_grade: t.evidence_grade,
    conviction: t.conviction,
    status: t.status,
  }));

  const critiques: CritiqueRow[] = focusCritiques.map((c) => ({
    id: c.id,
    thesis_id: c.thesis_id,
    persona: c.persona,
    severity: c.severity,
    specific_concern: c.specific_concern,
    blocks: c.blocks,
  }));

  const dossiers: DossierRow[] = dossiersList
    .slice()
    .reverse()
    .map((d) => ({
      id: d.id,
      title: d.title,
      doc_type: d.doc_type,
      content_chars: d.content_chars,
      preview: d.content.slice(0, 320) + (d.content.length > 320 ? "…" : ""),
      created_at: d.created_at,
    }));

  return {
    header: { timestamp: nowUtcLabel(), status: "nominal", environment: "DEV", region: "local" },
    summary,
    liveMission,
    swarm: { nodes: swarmNodes, totalActive, totalAgents },
    pipeline,
    evidence,
    deliverables,
    recentRuns,
    sources,
    feeds: { findings, theses, critiques, dossiers },
  };
}

function pipelineProgress(p: PipelineStage[]): number {
  if (p.length === 0) return 0;
  const sum = p.reduce((a, s) => a + s.pct, 0);
  return Math.round(sum / p.length);
}

function stageLabel(p: PipelineStage[], status: string): string {
  if (status === "completed") return "Completed · all 10 stages";
  if (status === "failed") return "Failed";
  const active = p.find((s) => s.active);
  return active ? `In progress · ${active.label}` : "Queued";
}

function sourceMix(findings: { source_type: string }[]): { label: string; pct: number }[] {
  const total = findings.length || 1;
  const groups = new Map<string, number>();
  for (const f of findings) groups.set(f.source_type, (groups.get(f.source_type) ?? 0) + 1);
  const rows = Array.from(groups.entries()).map(([k, v]) => ({
    label: prettySource(k),
    pct: Math.round((v / total) * 100),
  }));
  rows.sort((a, b) => b.pct - a.pct);
  return rows.slice(0, 5);
}

function prettySource(k: string): string {
  switch (k) {
    case "pubmed":
      return "PubMed";
    case "uniprot":
      return "UniProt";
    case "opentargets":
      return "OpenTargets";
    case "chembl":
      return "ChEMBL";
    case "alphafold":
      return "AlphaFold";
    case "novelty":
      return "Novelty";
    case "patent_signal":
      return "Patent";
    case "admet_card":
      return "ADMET";
    default:
      return k;
  }
}

function confidenceMix(s: DashboardSummary): { label: string; pct: number }[] {
  const total =
    s.grade_a_findings +
    s.grade_b_findings +
    s.grade_c_findings +
    s.grade_d_findings +
    s.grade_x_findings;
  if (!total) {
    return [
      { label: "Low", pct: 25 },
      { label: "Med", pct: 25 },
      { label: "High", pct: 25 },
      { label: "Very High", pct: 25 },
    ];
  }
  const round = (n: number) => Math.round((n / total) * 100);
  return [
    { label: "Low", pct: round(s.grade_d_findings + s.grade_x_findings) },
    { label: "Med", pct: round(s.grade_c_findings) },
    { label: "High", pct: round(s.grade_b_findings) },
    { label: "Very High", pct: round(s.grade_a_findings) },
  ];
}
