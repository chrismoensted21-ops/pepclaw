import { findAssociations } from "../sources/opentargets";
import { addFinding } from "../repo";
import type { AgentContext } from "./index";

export async function runTargetPathway(ctx: AgentContext) {
  const query = ctx.targetClass || ctx.query;
  const assocs = await findAssociations(query).catch(() => []);
  let added = 0;
  for (const a of assocs) {
    const top = a.topDiseases.slice(0, 5);
    addFinding({
      mission_id: ctx.missionId,
      task_id: ctx.taskId,
      pool: "target_pathway",
      source_type: "opentargets",
      source_ref: `opentargets:${a.ensemblId}`,
      title: `${a.approvedSymbol} — ${a.approvedName}`,
      content: [
        `Top disease associations:`,
        ...top.map(
          (d, i) =>
            `${i + 1}. ${d.name} (score ${d.score.toFixed(2)}${d.therapeuticAreas.length ? `, ${d.therapeuticAreas.slice(0, 2).join(", ")}` : ""})`
        ),
      ].join("\n"),
      url: a.url,
      relevance_score: top[0]?.score ?? 0.5,
      evidence_grade: top[0]?.score && top[0].score > 0.5 ? "A" : "B",
      target: a.approvedSymbol,
      metadata: { ensemblId: a.ensemblId, diseases: a.topDiseases },
    });
    added++;
  }
  return { summary: `${added} target/disease associations from OpenTargets` };
}
