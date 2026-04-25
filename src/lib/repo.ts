/**
 * Thin repository over SQLite. All swarm state goes through this layer.
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
  TaskStatus,
  Thesis,
} from "./types";
import { shortId } from "./utils";

function nowIso(): string {
  return new Date().toISOString();
}

export interface NewMissionInput {
  query: string;
  target_class?: string | null;
  depth?: "scout" | "standard" | "deep";
  budget_cents?: number;
}

export function createMission(input: NewMissionInput): Mission {
  const db = getDb();
  const id = "msn_" + shortId().replace(/-/g, "").slice(0, 16);
  const created_at = nowIso();
  db.prepare(
    `INSERT INTO missions (id, query, target_class, depth, status, budget_cents, spent_cents, created_at)
     VALUES (?, ?, ?, ?, 'queued', ?, 0, ?)`
  ).run(
    id,
    input.query,
    input.target_class ?? null,
    input.depth ?? "standard",
    input.budget_cents ?? 800,
    created_at
  );
  recordEvent("mission.created", { mission_id: id });
  return getMission(id)!;
}

export function getMission(id: string): Mission | null {
  return (getDb().prepare(`SELECT * FROM missions WHERE id = ?`).get(id) as Mission | undefined) ?? null;
}

export function listMissions(limit = 100): Mission[] {
  return getDb()
    .prepare(`SELECT * FROM missions ORDER BY datetime(created_at) DESC LIMIT ?`)
    .all(limit) as Mission[];
}

export function updateMissionStatus(
  id: string,
  status: MissionStatus,
  extras: Partial<Pick<Mission, "started_at" | "completed_at" | "failure_reason" | "spent_cents" | "commit_hash" | "commit_salt" | "revealed_at">> = {}
): void {
  const db = getDb();
  const fields: string[] = ["status = ?"];
  const values: (string | number | null)[] = [status];

  for (const k of [
    "started_at",
    "completed_at",
    "failure_reason",
    "spent_cents",
    "commit_hash",
    "commit_salt",
    "revealed_at",
  ] as const) {
    if (k in extras && extras[k] !== undefined) {
      fields.push(`${k} = ?`);
      values.push(extras[k] as string | number | null);
    }
  }
  values.push(id);
  db.prepare(`UPDATE missions SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  recordEvent("mission.status", { mission_id: id, status });
}

export function createTask(missionId: string, pool: AgentPool, agentIndex = 0, input?: unknown): Task {
  const db = getDb();
  const id = "tsk_" + shortId().replace(/-/g, "").slice(0, 16);
  const created_at = nowIso();
  db.prepare(
    `INSERT INTO tasks (id, mission_id, pool, agent_index, status, input, created_at)
     VALUES (?, ?, ?, ?, 'queued', ?, ?)`
  ).run(id, missionId, pool, agentIndex, input ? JSON.stringify(input) : null, created_at);
  recordEvent("task.created", { mission_id: missionId, pool, task_id: id });
  return db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id) as Task;
}

export function setTaskRunning(taskId: string): void {
  getDb()
    .prepare(`UPDATE tasks SET status = 'running', started_at = ? WHERE id = ?`)
    .run(nowIso(), taskId);
  const t = getDb().prepare(`SELECT mission_id, pool FROM tasks WHERE id = ?`).get(taskId) as
    | { mission_id: string; pool: AgentPool }
    | undefined;
  if (t) recordEvent("task.running", { mission_id: t.mission_id, pool: t.pool, task_id: taskId });
}

export function setTaskCompleted(taskId: string, output?: unknown): void {
  getDb()
    .prepare(`UPDATE tasks SET status = 'completed', completed_at = ?, output = ? WHERE id = ?`)
    .run(nowIso(), output ? JSON.stringify(output).slice(0, 60_000) : null, taskId);
  const t = getDb().prepare(`SELECT mission_id, pool FROM tasks WHERE id = ?`).get(taskId) as
    | { mission_id: string; pool: AgentPool }
    | undefined;
  if (t) recordEvent("task.completed", { mission_id: t.mission_id, pool: t.pool, task_id: taskId });
}

export function setTaskFailed(taskId: string, error: string): void {
  getDb()
    .prepare(`UPDATE tasks SET status = 'failed', completed_at = ?, error = ? WHERE id = ?`)
    .run(nowIso(), error.slice(0, 4000), taskId);
  const t = getDb().prepare(`SELECT mission_id, pool FROM tasks WHERE id = ?`).get(taskId) as
    | { mission_id: string; pool: AgentPool }
    | undefined;
  if (t)
    recordEvent("task.failed", {
      mission_id: t.mission_id,
      pool: t.pool,
      task_id: taskId,
      error,
    });
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

export function addFinding(input: NewFindingInput): Finding {
  const db = getDb();
  const id = "fnd_" + shortId().replace(/-/g, "").slice(0, 16);
  const created_at = nowIso();
  db.prepare(
    `INSERT INTO findings (id, mission_id, task_id, pool, source_type, source_ref, title, content, url, relevance_score, evidence_grade, target, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.mission_id,
    input.task_id ?? null,
    input.pool,
    input.source_type,
    input.source_ref,
    input.title ?? null,
    input.content,
    input.url ?? null,
    input.relevance_score ?? null,
    input.evidence_grade ?? null,
    input.target ?? null,
    input.metadata ? JSON.stringify(input.metadata) : null,
    created_at
  );
  recordEvent("finding.added", {
    mission_id: input.mission_id,
    pool: input.pool,
    source_ref: input.source_ref,
  });
  return db.prepare(`SELECT * FROM findings WHERE id = ?`).get(id) as Finding;
}

export function listFindings(missionId: string): Finding[] {
  return getDb()
    .prepare(`SELECT * FROM findings WHERE mission_id = ? ORDER BY datetime(created_at) ASC`)
    .all(missionId) as Finding[];
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

export function addThesis(input: NewThesisInput): Thesis {
  const db = getDb();
  const id = "ths_" + shortId().replace(/-/g, "").slice(0, 16);
  const created_at = nowIso();
  db.prepare(
    `INSERT INTO theses (id, mission_id, title, hypothesis, mechanism, target, evidence_summary, conviction, evidence_grade, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.mission_id,
    input.title,
    input.hypothesis,
    input.mechanism ?? null,
    input.target ?? null,
    input.evidence_summary ?? null,
    input.conviction ?? null,
    input.evidence_grade ?? null,
    input.status ?? "draft",
    created_at
  );
  recordEvent("thesis.added", { mission_id: input.mission_id, thesis_id: id });
  return db.prepare(`SELECT * FROM theses WHERE id = ?`).get(id) as Thesis;
}

export function listTheses(missionId: string): Thesis[] {
  return getDb()
    .prepare(`SELECT * FROM theses WHERE mission_id = ? ORDER BY datetime(created_at) ASC`)
    .all(missionId) as Thesis[];
}

export function updateThesisStatus(
  thesisId: string,
  status: string,
  conviction?: number | null
): void {
  const db = getDb();
  if (conviction !== undefined) {
    db.prepare(`UPDATE theses SET status = ?, conviction = ? WHERE id = ?`).run(
      status,
      conviction,
      thesisId
    );
  } else {
    db.prepare(`UPDATE theses SET status = ? WHERE id = ?`).run(status, thesisId);
  }
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

export function addCritique(input: NewCritiqueInput): Critique {
  const db = getDb();
  const id = "crt_" + shortId().replace(/-/g, "").slice(0, 16);
  const created_at = nowIso();
  db.prepare(
    `INSERT INTO critiques (id, mission_id, thesis_id, persona, severity, category, specific_concern, suggested_fix, blocks, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.mission_id,
    input.thesis_id,
    input.persona,
    input.severity,
    input.category ?? null,
    input.specific_concern,
    input.suggested_fix ?? null,
    input.blocks ? 1 : 0,
    created_at
  );
  recordEvent("critique.added", {
    mission_id: input.mission_id,
    persona: input.persona,
    severity: input.severity,
  });
  return db.prepare(`SELECT * FROM critiques WHERE id = ?`).get(id) as Critique;
}

export function listCritiques(missionId: string): Critique[] {
  return getDb()
    .prepare(`SELECT * FROM critiques WHERE mission_id = ? ORDER BY datetime(created_at) ASC`)
    .all(missionId) as Critique[];
}

export interface NewDossierInput {
  mission_id: string;
  title: string;
  content: string;
  doc_type: "synthesis" | "dossier";
}

export function addDossier(input: NewDossierInput): Dossier {
  const db = getDb();
  const id = "dos_" + shortId().replace(/-/g, "").slice(0, 16);
  const created_at = nowIso();
  db.prepare(
    `INSERT INTO dossiers (id, mission_id, title, content, content_chars, doc_type, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, input.mission_id, input.title, input.content, input.content.length, input.doc_type, created_at);
  recordEvent("dossier.added", {
    mission_id: input.mission_id,
    doc_type: input.doc_type,
  });
  return db.prepare(`SELECT * FROM dossiers WHERE id = ?`).get(id) as Dossier;
}

export function listDossiers(missionId: string): Dossier[] {
  return getDb()
    .prepare(`SELECT * FROM dossiers WHERE mission_id = ? ORDER BY datetime(created_at) ASC`)
    .all(missionId) as Dossier[];
}

export function listMissionTasks(missionId: string): Task[] {
  return getDb()
    .prepare(`SELECT * FROM tasks WHERE mission_id = ? ORDER BY datetime(created_at) ASC`)
    .all(missionId) as Task[];
}

export function poolStats(): { pool: string; total: number; completed: number; running: number; failed: number }[] {
  return getDb()
    .prepare(
      `SELECT pool,
              COUNT(*) AS total,
              SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
              SUM(CASE WHEN status = 'running'   THEN 1 ELSE 0 END) AS running,
              SUM(CASE WHEN status = 'failed'    THEN 1 ELSE 0 END) AS failed
       FROM tasks GROUP BY pool`
    )
    .all() as { pool: string; total: number; completed: number; running: number; failed: number }[];
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

export function dashboardSummary(): DashboardSummary {
  const db = getDb();
  const r = db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM missions) AS total_missions,
        (SELECT COUNT(*) FROM findings) AS total_findings,
        (SELECT COUNT(*) FROM theses) AS total_theses,
        (SELECT COUNT(*) FROM critiques) AS total_critiques,
        (SELECT COUNT(*) FROM tasks) AS total_tasks,
        (SELECT COUNT(*) FROM findings WHERE evidence_grade = 'A') AS grade_a_findings,
        (SELECT COUNT(*) FROM findings WHERE evidence_grade = 'B') AS grade_b_findings,
        (SELECT COUNT(*) FROM findings WHERE evidence_grade = 'C') AS grade_c_findings,
        (SELECT COUNT(*) FROM findings WHERE evidence_grade = 'D') AS grade_d_findings,
        (SELECT COUNT(*) FROM findings WHERE evidence_grade = 'X') AS grade_x_findings,
        (SELECT COUNT(*) FROM findings WHERE source_type = 'pubmed') AS pubmed_findings,
        (SELECT COUNT(*) FROM findings WHERE source_type != 'pubmed') AS swarm_findings,
        (SELECT COUNT(*) FROM tasks WHERE status = 'running') AS active_agents`
    )
    .get() as DashboardSummary;
  return r;
}

export function recordEvent(kind: string, payload: Record<string, unknown> & { mission_id?: string; pool?: AgentPool }): void {
  try {
    getDb()
      .prepare(`INSERT INTO events (mission_id, kind, pool, payload, created_at) VALUES (?, ?, ?, ?, ?)`)
      .run(
        payload.mission_id ?? null,
        kind,
        payload.pool ?? null,
        JSON.stringify(payload),
        nowIso()
      );
  } catch {
    // never throw on telemetry
  }
}

export function eventsSince(sinceId: number, missionId?: string | null, limit = 200): SwarmEvent[] {
  if (missionId) {
    return getDb()
      .prepare(
        `SELECT * FROM events WHERE id > ? AND (mission_id = ? OR mission_id IS NULL) ORDER BY id ASC LIMIT ?`
      )
      .all(sinceId, missionId, limit) as SwarmEvent[];
  }
  return getDb()
    .prepare(`SELECT * FROM events WHERE id > ? ORDER BY id ASC LIMIT ?`)
    .all(sinceId, limit) as SwarmEvent[];
}

export function lastEventId(): number {
  const r = getDb().prepare(`SELECT COALESCE(MAX(id), 0) AS id FROM events`).get() as { id: number };
  return r.id;
}
