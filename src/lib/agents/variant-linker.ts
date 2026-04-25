import { searchTargets } from "../sources/chembl";
import { addFinding } from "../repo";
import type { AgentContext } from "./index";

export async function runVariantLinker(ctx: AgentContext) {
  const query = ctx.targetClass || ctx.query;
  const hits = await searchTargets(query, 4).catch(() => []);
  let added = 0;
  for (const h of hits) {
    addFinding({
      mission_id: ctx.missionId,
      task_id: ctx.taskId,
      pool: "variant_linker",
      source_type: "chembl",
      source_ref: `chembl:${h.chemblId}`,
      title: `${h.prefName} (${h.targetType ?? "unknown type"})`,
      content: [
        `Organism: ${h.organism ?? "n/a"}`,
        `Known bioactivities: ${h.knownLigands.toLocaleString()}`,
        h.knownLigands > 1000
          ? "Heavily interrogated chemically; rich SAR baseline available."
          : h.knownLigands > 100
            ? "Moderately interrogated; useful baseline."
            : "Sparsely interrogated; potential whitespace.",
      ].join("\n"),
      url: h.url,
      relevance_score: Math.min(1, Math.log10((h.knownLigands || 1) + 10) / 5),
      evidence_grade: h.knownLigands > 100 ? "B" : "C",
      target: h.prefName,
      metadata: { chemblId: h.chemblId, knownLigands: h.knownLigands },
    });
    added++;
  }
  return { summary: `${added} ChEMBL targets linked` };
}
