/**
 * Repository over Supabase Postgres. All swarm state goes through this layer.
 * Every function is async; rows are returned as the typed shapes from
 * `./types` (jsonb columns come back as parsed objects, not strings).
 */
import { getDb } from "./db";
import type {
  AgentPool,
  Critique,
  Dossier,
  EvidenceGrade,
  Finding,
  Mission,
  MissionStatus,
  SwarmEvent,
  Task,
  Thesis,
} from "./types";
import { shortId } from "./utils";

function nowIso(): string {
  return new Date().toISOString();
}

function genId(prefix: string): string {
  return `${prefix}_` + shortId().replace(/-/g, "").slice(0, 16);
}

export interface NewMissionInput {
  query: string;
  target_class?: string | null;
  depth?: "scout" | "standard" | "deep";
  budget_cents?: number;
}

export async function createMission(input: NewMissionInput): Promise<Mission> {
  const db = getDb();
  const id = genId("msn");
  const { data, error } = await db
    .from("missions")
    .insert({
      id,
      query: input.query,
      target_class: input.target_class ?? null,
      depth: input.depth ?? "standard",
      status: "queued",
      budget_cents: input.budget_cents ?? 800,
      spent_cents: 0,
    })
    .select("*")
    .single();
  if (error) throw new Error(`createMission failed: ${error.message}`);
  await recordEvent("mission.created", { mission_id: id });
  return data as Mission;
}

export async function getMission(id: string): Promise<Mission | null> {
  const { data, error } = await getDb()
    .from("missions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getMission failed: ${error.message}`);
  return (data as Mission | null) ?? null;
}

export async function listMissions(limit = 100): Promise<Mission[]> {
  const { data, error } = await getDb()
    .from("missions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`listMissions failed: ${error.message}`);
  return (data ?? []) as Mission[];
}

export async function updateMissionStatus(
  id: string,
  status: MissionStatus,
  extras: Partial<
    Pick<
      Mission,
      | "started_at"
      | "completed_at"
      | "failure_reason"
      | "spent_cents"
      | "commit_hash"
      | "commit_salt"
      | "revealed_at"
    >
  > = {}
): Promise<void> {
  const patch: Record<string, unknown> = { status };
  for (const k of [
    "started_at",
    "completed_at",
    "failure_reason",
    "spent_cents",
    "commit_hash",
    "commit_salt",
    "revealed_at",
  ] as const) {
    if (k in extras && extras[k] !== undefined) patch[k] = extras[k];
  }
  const { error } = await getDb().from("missions").update(patch).eq("id", id);
  if (error) throw new Error(`updateMissionStatus failed: ${error.message}`);
  await recordEvent("mission.status", { mission_id: id, status });
}

export async function createTask(
  missionId: string,
  pool: AgentPool,
  agentIndex = 0,
  input?: unknown
): Promise<Task> {
  const db = getDb();
  const id = genId("tsk");
  const { data, error } = await db
    .from("tasks")
    .insert({
      id,
      mission_id: missionId,
      pool,
      agent_index: agentIndex,
      status: "queued",
      input: input ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(`createTask failed: ${error.message}`);
  await recordEvent("task.created", { mission_id: missionId, pool, task_id: id });
  return data as Task;
}

export async function setTaskRunning(taskId: string): Promise<void> {
  const db = getDb();
  const { error } = await db
    .from("tasks")
    .update({ status: "running", started_at: nowIso() })
    .eq("id", taskId);
  if (error) throw new Error(`setTaskRunning failed: ${error.message}`);
  const { data } = await db
    .from("tasks")
    .select("mission_id, pool")
    .eq("id", taskId)
    .maybeSingle();
  if (data) {
    await recordEvent("task.running", {
      mission_id: data.mission_id,
      pool: data.pool as AgentPool,
      task_id: taskId,
    });
  }
}

export async function setTaskCompleted(taskId: string, output?: unknown): Promise<void> {
  const db = getDb();
  const { error } = await db
    .from("tasks")
    .update({ status: "completed", completed_at: nowIso(), output: output ?? null })
    .eq("id", taskId);
  if (error) throw new Error(`setTaskCompleted failed: ${error.message}`);
  const { data } = await db
    .from("tasks")
    .select("mission_id, pool")
    .eq("id", taskId)
    .maybeSingle();
  if (data) {
    await recordEvent("task.completed", {
      mission_id: data.mission_id,
      pool: data.pool as AgentPool,
      task_id: taskId,
    });
  }
}

export async function setTaskFailed(taskId: string, error: string): Promise<void> {
  const db = getDb();
  const { error: updErr } = await db
    .from("tasks")
    .update({
      status: "failed",
      completed_at: nowIso(),
      error: error.slice(0, 4000),
    })
    .eq("id", taskId);
  if (updErr) throw new Error(`setTaskFailed failed: ${updErr.message}`);
  const { data } = await db
    .from("tasks")
    .select("mission_id, pool")
    .eq("id", taskId)
    .maybeSingle();
  if (data) {
    await recordEvent("task.failed", {
      mission_id: data.mission_id,
      pool: data.pool as AgentPool,
      task_id: taskId,
      error,
    });
  }
}

export interface NewFindingInput {
  mission_id: string;
  task_id?: string | null;
  pool: AgentPool;
  source_type: string;
  source_ref: string;
  title?: string | null;
  content: string;
  url?: string | null;
  relevance_score?: number | null;
  evidence_grade?: EvidenceGrade | null;
  target?: string | null;
  metadata?: Record<string, unknown>;
}

export async function addFinding(input: NewFindingInput): Promise<Finding> {
  const db = getDb();
  const id = genId("fnd");
  const { data, error } = await db
    .from("findings")
    .insert({
      id,
      mission_id: input.mission_id,
      task_id: input.task_id ?? null,
      pool: input.pool,
      source_type: input.source_type,
      source_ref: input.source_ref,
      title: input.title ?? null,
      content: input.content,
      url: input.url ?? null,
      relevance_score: input.relevance_score ?? null,
      evidence_grade: input.evidence_grade ?? null,
      target: input.target ?? null,
      metadata: input.metadata ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(`addFinding failed: ${error.message}`);
  await recordEvent("finding.added", {
    mission_id: input.mission_id,
    pool: input.pool,
    source_ref: input.source_ref,
  });
  return data as Finding;
}

export async function listFindings(missionId: string): Promise<Finding[]> {
  const { data, error } = await getDb()
    .from("findings")
    .select("*")
    .eq("mission_id", missionId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`listFindings failed: ${error.message}`);
  return (data ?? []) as Finding[];
}

export interface NewThesisInput {
  mission_id: string;
  title: string;
  hypothesis: string;
  mechanism?: string | null;
  target?: string | null;
  evidence_summary?: string | null;
  conviction?: number | null;
  evidence_grade?: EvidenceGrade | null;
  status?: string;
}

export async function addThesis(input: NewThesisInput): Promise<Thesis> {
  const db = getDb();
  const id = genId("ths");
  const { data, error } = await db
    .from("theses")
    .insert({
      id,
      mission_id: input.mission_id,
      title: input.title,
      hypothesis: input.hypothesis,
      mechanism: input.mechanism ?? null,
      target: input.target ?? null,
      evidence_summary: input.evidence_summary ?? null,
      conviction: input.conviction ?? null,
      evidence_grade: input.evidence_grade ?? null,
      status: input.status ?? "draft",
    })
    .select("*")
    .single();
  if (error) throw new Error(`addThesis failed: ${error.message}`);
  await recordEvent("thesis.added", { mission_id: input.mission_id, thesis_id: id });
  return data as Thesis;
}

export async function listTheses(missionId: string): Promise<Thesis[]> {
  const { data, error } = await getDb()
    .from("theses")
    .select("*")
    .eq("mission_id", missionId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`listTheses failed: ${error.message}`);
  return (data ?? []) as Thesis[];
}

export async function updateThesisStatus(
  thesisId: string,
  status: string,
  conviction?: number | null
): Promise<void> {
  const patch: Record<string, unknown> = { status };
  if (conviction !== undefined) patch.conviction = conviction;
  const { error } = await getDb().from("theses").update(patch).eq("id", thesisId);
  if (error) throw new Error(`updateThesisStatus failed: ${error.message}`);
}

export interface NewCritiqueInput {
  mission_id: string;
  thesis_id: string;
  persona: "skeptic" | "scientist" | "senior_reviewer";
  severity: "info" | "warning" | "block";
  category?: string | null;
  specific_concern: string;
  suggested_fix?: string | null;
  blocks?: boolean;
}

export async function addCritique(input: NewCritiqueInput): Promise<Critique> {
  const db = getDb();
  const id = genId("crt");
  const { data, error } = await db
    .from("critiques")
    .insert({
      id,
      mission_id: input.mission_id,
      thesis_id: input.thesis_id,
      persona: input.persona,
      severity: input.severity,
      category: input.category ?? null,
      specific_concern: input.specific_concern,
      suggested_fix: input.suggested_fix ?? null,
      blocks: input.blocks === true,
    })
    .select("*")
    .single();
  if (error) throw new Error(`addCritique failed: ${error.message}`);
  await recordEvent("critique.added", {
    mission_id: input.mission_id,
    persona: input.persona,
    severity: input.severity,
  });
  return data as Critique;
}

export async function listCritiques(missionId: string): Promise<Critique[]> {
  const { data, error } = await getDb()
    .from("critiques")
    .select("*")
    .eq("mission_id", missionId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`listCritiques failed: ${error.message}`);
  return (data ?? []) as Critique[];
}

export interface NewDossierInput {
  mission_id: string;
  title: string;
  content: string;
  doc_type: "synthesis" | "dossier";
}

export async function addDossier(input: NewDossierInput): Promise<Dossier> {
  const db = getDb();
  const id = genId("dos");
  const { data, error } = await db
    .from("dossiers")
    .insert({
      id,
      mission_id: input.mission_id,
      title: input.title,
      content: input.content,
      content_chars: input.content.length,
      doc_type: input.doc_type,
    })
    .select("*")
    .single();
  if (error) throw new Error(`addDossier failed: ${error.message}`);
  await recordEvent("dossier.added", {
    mission_id: input.mission_id,
    doc_type: input.doc_type,
  });
  return data as Dossier;
}

export async function listDossiers(missionId: string): Promise<Dossier[]> {
  const { data, error } = await getDb()
    .from("dossiers")
    .select("*")
    .eq("mission_id", missionId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`listDossiers failed: ${error.message}`);
  return (data ?? []) as Dossier[];
}

export async function listMissionTasks(missionId: string): Promise<Task[]> {
  const { data, error } = await getDb()
    .from("tasks")
    .select("*")
    .eq("mission_id", missionId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`listMissionTasks failed: ${error.message}`);
  return (data ?? []) as Task[];
}

export interface PoolStatRow {
  pool: string;
  total: number;
  completed: number;
  running: number;
  failed: number;
}

export async function poolStats(): Promise<PoolStatRow[]> {
  // No SQL aggregation in PostgREST — pull the slim columns and bucket in JS.
  const { data, error } = await getDb().from("tasks").select("pool, status");
  if (error) throw new Error(`poolStats failed: ${error.message}`);
  const rows = (data ?? []) as { pool: string; status: string }[];
  const byPool = new Map<string, PoolStatRow>();
  for (const r of rows) {
    const cur =
      byPool.get(r.pool) ??
      ({ pool: r.pool, total: 0, completed: 0, running: 0, failed: 0 } as PoolStatRow);
    cur.total += 1;
    if (r.status === "completed") cur.completed += 1;
    else if (r.status === "running") cur.running += 1;
    else if (r.status === "failed") cur.failed += 1;
    byPool.set(r.pool, cur);
  }
  return Array.from(byPool.values());
}

export interface DashboardSummary {
  total_missions: number;
  total_findings: number;
  total_theses: number;
  total_critiques: number;
  total_tasks: number;
  grade_a_findings: number;
  grade_b_findings: number;
  grade_c_findings: number;
  grade_d_findings: number;
  grade_x_findings: number;
  pubmed_findings: number;
  swarm_findings: number;
  active_agents: number;
}

interface CountLike {
  count: number | null;
  error: { message: string } | null;
}

async function takeCount(label: string, result: PromiseLike<CountLike>): Promise<number> {
  const { count, error } = await result;
  if (error) throw new Error(`${label} failed: ${error.message}`);
  return count ?? 0;
}

export async function dashboardSummary(): Promise<DashboardSummary> {
  const db = getDb();
  const opts = { count: "exact" as const, head: true };
  const [
    total_missions,
    total_findings,
    total_theses,
    total_critiques,
    total_tasks,
    grade_a_findings,
    grade_b_findings,
    grade_c_findings,
    grade_d_findings,
    grade_x_findings,
    pubmed_findings,
    swarm_findings,
    active_agents,
  ] = await Promise.all([
    takeCount("count(missions)", db.from("missions").select("*", opts)),
    takeCount("count(findings)", db.from("findings").select("*", opts)),
    takeCount("count(theses)", db.from("theses").select("*", opts)),
    takeCount("count(critiques)", db.from("critiques").select("*", opts)),
    takeCount("count(tasks)", db.from("tasks").select("*", opts)),
    takeCount("count(findings A)", db.from("findings").select("*", opts).eq("evidence_grade", "A")),
    takeCount("count(findings B)", db.from("findings").select("*", opts).eq("evidence_grade", "B")),
    takeCount("count(findings C)", db.from("findings").select("*", opts).eq("evidence_grade", "C")),
    takeCount("count(findings D)", db.from("findings").select("*", opts).eq("evidence_grade", "D")),
    takeCount("count(findings X)", db.from("findings").select("*", opts).eq("evidence_grade", "X")),
    takeCount("count(findings pubmed)", db.from("findings").select("*", opts).eq("source_type", "pubmed")),
    takeCount("count(findings non-pubmed)", db.from("findings").select("*", opts).neq("source_type", "pubmed")),
    takeCount("count(tasks running)", db.from("tasks").select("*", opts).eq("status", "running")),
  ]);

  return {
    total_missions,
    total_findings,
    total_theses,
    total_critiques,
    total_tasks,
    grade_a_findings,
    grade_b_findings,
    grade_c_findings,
    grade_d_findings,
    grade_x_findings,
    pubmed_findings,
    swarm_findings,
    active_agents,
  };
}

export async function recordEvent(
  kind: string,
  payload: Record<string, unknown> & { mission_id?: string; pool?: AgentPool }
): Promise<void> {
  try {
    await getDb()
      .from("events")
      .insert({
        mission_id: payload.mission_id ?? null,
        kind,
        pool: payload.pool ?? null,
        payload,
      });
  } catch {
    // never throw on telemetry
  }
}

export async function eventsSince(
  sinceId: number,
  missionId?: string | null,
  limit = 200
): Promise<SwarmEvent[]> {
  const db = getDb();
  let q = db
    .from("events")
    .select("*")
    .gt("id", sinceId)
    .order("id", { ascending: true })
    .limit(limit);
  if (missionId) q = q.or(`mission_id.eq.${missionId},mission_id.is.null`);
  const { data, error } = await q;
  if (error) throw new Error(`eventsSince failed: ${error.message}`);
  return (data ?? []) as SwarmEvent[];
}

export async function lastEventId(): Promise<number> {
  const { data, error } = await getDb()
    .from("events")
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`lastEventId failed: ${error.message}`);
  return (data?.id as number | undefined) ?? 0;
}
