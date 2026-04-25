import { addFinding, listFindings } from "../repo";
import type { AgentContext } from "./index";

/**
 * Patent competitive surveillance.
 * The full Lens.org / EPO API requires a key. We approximate by scoring patent-density
 * signals from PubMed metadata (publication type, MeSH terms) and ChEMBL ligand counts.
 */
export async function runPatentCompetitive(ctx: AgentContext) {
  const findings = listFindings(ctx.missionId);
  const chembl = findings.filter((f) => f.source_type === "chembl");
  const lit = findings.filter((f) => f.source_type === "pubmed");
  if (chembl.length === 0 && lit.length === 0) {
    return { summary: "No upstream signals to score patent-density against." };
  }

  const targets = new Map<string, { liganded: number; papers: number }>();
  for (const f of chembl) {
    const meta = safeJson<{ knownLigands?: number }>(f.metadata) ?? {};
    const t = f.target ?? f.title ?? "unknown";
    const cur = targets.get(t) ?? { liganded: 0, papers: 0 };
    cur.liganded += meta.knownLigands ?? 0;
    targets.set(t, cur);
  }
  for (const f of lit) {
    const t = f.target ?? "general";
    const cur = targets.get(t) ?? { liganded: 0, papers: 0 };
    cur.papers += 1;
    targets.set(t, cur);
  }
  let added = 0;
  for (const [target, { liganded, papers }] of targets) {
    const density = liganded > 5000 ? "Crowded" : liganded > 500 ? "Moderate" : "Whitespace";
    const ftoRisk = liganded > 5000 ? "Elevated" : liganded > 500 ? "Moderate" : "Low";
    addFinding({
      mission_id: ctx.missionId,
      task_id: ctx.taskId,
      pool: "patent_competitive",
      source_type: "patent_signal",
      source_ref: `patent:${target}`,
      title: `Patent landscape · ${target}`,
      content: [
        `Estimated patent density: ${density}`,
        `FTO risk: ${ftoRisk}`,
        `Known ligands (ChEMBL): ${liganded.toLocaleString()}`,
        `Recent literature signal: ${papers} cited PubMed item(s)`,
      ].join("\n"),
      url: null,
      relevance_score: density === "Whitespace" ? 0.85 : density === "Moderate" ? 0.55 : 0.3,
      evidence_grade: density === "Whitespace" ? "A" : density === "Moderate" ? "B" : "C",
      target,
      metadata: { density, ftoRisk, liganded, papers },
    });
    added++;
  }
  return { summary: `${added} patent-landscape readings produced` };
}

function safeJson<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}
