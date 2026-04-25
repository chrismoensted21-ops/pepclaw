import { searchUniprot } from "../sources/uniprot";
import { lookupAlphaFold } from "../sources/alphafold";
import { addFinding } from "../repo";
import type { AgentContext } from "./index";

export async function runSequenceStructure(ctx: AgentContext) {
  const query = ctx.targetClass || ctx.query;
  const entries = await searchUniprot(query, 4).catch(() => []);
  let added = 0;
  for (const e of entries) {
    const af = e.accession ? await lookupAlphaFold(e.accession).catch(() => null) : null;
    const tractability = scoreTractability(e.length, af?.meanPlddt ?? null);
    await addFinding({
      mission_id: ctx.missionId,
      task_id: ctx.taskId,
      pool: "sequence_structure",
      source_type: "uniprot",
      source_ref: `uniprot:${e.accession}`,
      title: `${e.proteinName} (${e.geneName ?? e.accession})`,
      content: [
        `Organism: ${e.organism ?? "n/a"}`,
        `Length: ${e.length ?? "n/a"} aa`,
        e.function ? `Function: ${truncate(e.function, 600)}` : null,
        af ? `AlphaFold pLDDT: ${af.meanPlddt?.toFixed(1) ?? "n/a"}` : "AlphaFold: not available",
        `Structural tractability: ${tractability.label} (${tractability.score.toFixed(2)})`,
      ]
        .filter(Boolean)
        .join("\n"),
      url: e.url,
      relevance_score: tractability.score,
      evidence_grade: af?.meanPlddt && af.meanPlddt > 80 ? "A" : "B",
      target: e.geneName ?? e.accession,
      metadata: {
        accession: e.accession,
        sequence_head: e.sequence?.slice(0, 40),
        features: e.features,
        alphafold: af,
      },
    });
    added++;
  }
  return { summary: `${added} structural annotations from UniProt + AlphaFold` };
}

function scoreTractability(length: number | null, plddt: number | null): { score: number; label: string } {
  let score = 0.5;
  if (length) {
    if (length >= 8 && length <= 60) score += 0.3;
    else if (length <= 150) score += 0.15;
  }
  if (plddt !== null) {
    if (plddt > 90) score += 0.25;
    else if (plddt > 70) score += 0.15;
    else if (plddt > 50) score += 0.05;
  }
  score = Math.min(1, score);
  const label = score > 0.8 ? "High" : score > 0.6 ? "Medium" : "Low";
  return { score, label };
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
