/**
 * Mission orchestrator. Builds the 5-layer DAG, dispatches tasks across pools,
 * tracks budget, and emits SwarmEvents that the dashboard consumes via SSE.
 */
import {
  createMission,
  createTask,
  setTaskRunning,
  setTaskCompleted,
  setTaskFailed,
  updateMissionStatus,
  recordEvent,
  getMission,
} from "./repo";
import { AGENT_RUNNERS } from "./agents";
import { commit } from "./protocol";
import type { AgentPool, DepthLevel } from "./types";

export interface StartInput {
  query: string;
  target_class?: string | null;
  depth?: DepthLevel;
  budget_cents?: number;
}

interface Layer {
  pools: AgentPool[];
  parallel: boolean;
}

const DEFAULT_DAG: Layer[] = [
  // Layer 1 — upstream ingestion (parallel)
  {
    parallel: true,
    pools: [
      "literature_miner",
      "sequence_structure",
      "target_pathway",
      "variant_linker",
    ],
  },
  // Layer 2 — derived annotation (depends on layer 1)
  {
    parallel: true,
    pools: ["admet_developability", "novelty_scout", "patent_competitive"],
  },
  // Layer 3 — grading (sequential pre-thesis)
  { parallel: false, pools: ["evidence_grader"] },
  // Layer 4 — reasoning + critique
  { parallel: false, pools: ["thesis_generator"] },
  { parallel: false, pools: ["red_team"] },
  // Layer 5 — output
  { parallel: false, pools: ["synthesizer"] },
  { parallel: false, pools: ["dossier_assembler"] },
];

export async function startMission(input: StartInput): Promise<string> {
  const mission = createMission({
    query: input.query,
    target_class: input.target_class ?? null,
    depth: input.depth ?? "standard",
    budget_cents: input.budget_cents ?? 800,
  });

  const c = commit(mission.query, mission.target_class);
  updateMissionStatus(mission.id, "queued", {
    commit_hash: c.hash,
    commit_salt: null, // salt revealed only on completion
  });
  recordEvent("mission.committed", { mission_id: mission.id, commit_hash: c.hash });

  // Persist salt in-memory for the duration of the run (revealed at completion).
  void runMissionAsync(mission.id, c.salt).catch((e) => {
    updateMissionStatus(mission.id, "failed", {
      completed_at: new Date().toISOString(),
      failure_reason: (e as Error).message ?? String(e),
    });
  });

  return mission.id;
}

async function runMissionAsync(missionId: string, salt: string): Promise<void> {
  const startedAt = new Date().toISOString();
  updateMissionStatus(missionId, "running", { started_at: startedAt });
  recordEvent("mission.started", { mission_id: missionId });

  const mission = getMission(missionId);
  if (!mission) throw new Error("Mission disappeared");

  let agentIndex = 0;
  let spent = 0;

  for (const layer of DEFAULT_DAG) {
    const tasks = layer.pools.map((pool) => ({
      pool,
      task: createTask(missionId, pool, agentIndex++),
    }));

    const work = tasks.map(async ({ pool, task }) => {
      setTaskRunning(task.id);
      const runner = AGENT_RUNNERS[pool];
      try {
        const result = await runner({
          missionId,
          query: mission.query,
          targetClass: mission.target_class,
          taskId: task.id,
          agentIndex: task.agent_index,
        });
        setTaskCompleted(task.id, result);
        if (typeof result?.cost_cents === "number") spent += result.cost_cents;
      } catch (e) {
        setTaskFailed(task.id, (e as Error).message ?? String(e));
        recordEvent("agent.error", {
          mission_id: missionId,
          pool,
          error: (e as Error).message,
        });
      }
    });

    if (layer.parallel) {
      await Promise.all(work);
    } else {
      for (const w of work) await w;
    }
  }

  const completedAt = new Date().toISOString();
  updateMissionStatus(missionId, "completed", {
    completed_at: completedAt,
    spent_cents: spent,
    commit_salt: salt,
    revealed_at: completedAt,
  });
  recordEvent("mission.completed", { mission_id: missionId, spent_cents: spent });
}
