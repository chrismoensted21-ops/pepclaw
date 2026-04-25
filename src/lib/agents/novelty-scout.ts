import { addFinding, listFindings } from "../repo";
import { getDb } from "../db";
import type { AgentContext } from "./index";

/**
 * Novelty scoring: how often does this source_ref appear across historical missions?
 * Lower historical count → higher novelty score.
 */
export async function runNoveltyScout(ctx: AgentContext) {
  const db = getDb();
  const own = listFindings(ctx.missionId).filter((f) => f.source_type === "pubmed" || f.source_type === "uniprot");
  let scored = 0;
  for (const f of own) {
    const r = db
      .prepare(
        `SELECT COUNT(*) AS n FROM findings WHERE source_ref = ? AND mission_id != ?`
      )
      .get(f.source_ref, ctx.missionId) as { n: number };
    const novelty = 1 - Math.min(1, r.n / 4);
    if (novelty > 0.5) {
      addFinding({
        mission_id: ctx.missionId,
        task_id: ctx.taskId,
        pool: "novelty_scout",
        source_type: "novelty",
        source_ref: `novelty:${f.source_ref}`,
        title: `Novelty signal · ${f.title ?? f.source_ref}`,
        content: `Whitespace score ${novelty.toFixed(2)} — ${f.source_ref} previously seen in ${r.n} mission(s).`,
        url: f.url,
        relevance_score: novelty,
        evidence_grade: novelty > 0.85 ? "A" : "B",
        target: f.target,
        metadata: { novelty, prior_seen: r.n, of_finding: f.id },
      });
      scored++;
    }
  }
  return { summary: `${scored} novelty signals (whitespace) flagged` };
}
