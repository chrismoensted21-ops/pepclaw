import { listFindings, listTheses, listCritiques, listDossiers, addDossier, getMission } from "../repo";
import type { AgentContext } from "./index";

/**
 * Assembles a buyer-safe markdown dossier with PMIDs, hedged claims and full evidence chain.
 * Deterministic — does NOT call the LLM; uses stored swarm state.
 */
export async function runDossierAssembler(ctx: AgentContext) {
  const mission = getMission(ctx.missionId);
  const findings = listFindings(ctx.missionId);
  const theses = listTheses(ctx.missionId);
  const critiques = listCritiques(ctx.missionId);
  const synthesisDocs = listDossiers(ctx.missionId).filter((d) => d.doc_type === "synthesis");

  const grade = (g: string | null) => (g ? `[${g}]` : "[?]");
  const head = (s: string) => `\n\n## ${s}\n`;

  const pubmed = findings.filter((f) => f.source_type === "pubmed");
  const pubmedBlock = pubmed
    .slice(0, 30)
    .map((f) => {
      const meta = safeJson<{ year?: number; journal?: string }>(f.metadata) ?? {};
      const pmid = f.source_ref.replace(/^pubmed:/, "");
      return `- ${grade(f.evidence_grade)} ${f.title ?? "(untitled)"} — _${meta.journal ?? "n/a"}_, ${meta.year ?? "n/a"}. [PMID:${pmid}](${f.url ?? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`})`;
    })
    .join("\n");

  const upBlock = (sourceType: string, label: string) => {
    const rows = findings.filter((f) => f.source_type === sourceType).slice(0, 12);
    if (rows.length === 0) return "";
    return (
      head(label) +
      rows
        .map((f) => `- ${grade(f.evidence_grade)} ${f.title ?? f.source_ref}${f.url ? ` — [${f.source_ref}](${f.url})` : ""}`)
        .join("\n")
    );
  };

  const thesesBlock = theses
    .map((t) => {
      const c = critiques.filter((c) => c.thesis_id === t.id);
      const blocked = c.find((x) => x.blocks);
      const status = blocked ? "**BLOCKED**" : t.status === "qa_pending" ? "QA pending" : t.status;
      return `### ${t.title}
- **Status**: ${status}
- **Evidence grade**: ${t.evidence_grade ?? "?"}
- **Conviction**: ${t.conviction?.toFixed(2) ?? "?"}
- **Target**: ${t.target ?? "(unstated)"}
- **Hypothesis**: ${t.hypothesis}
- **Mechanism**: ${t.mechanism ?? "(unstated)"}
- **Critiques**:
${c.map((cr) => `  - _${cr.persona}/${cr.severity}_: ${cr.specific_concern}${cr.suggested_fix ? ` → ${cr.suggested_fix}` : ""}`).join("\n") || "  - (none)"}`;
    })
    .join("\n\n");

  const synthesisBlock = synthesisDocs
    .map((d) => `> ${d.content.slice(0, 1200)}${d.content.length > 1200 ? "…" : ""}`)
    .join("\n\n");

  const md = [
    `# Dossier · ${mission?.query ?? ctx.query}`,
    ``,
    `**Mission ID**: \`${ctx.missionId}\`  `,
    `**Target class**: ${mission?.target_class ?? ctx.targetClass ?? "(unspecified)"}  `,
    `**Depth**: ${mission?.depth}  `,
    `**Started**: ${mission?.started_at ?? "n/a"}  `,
    mission?.commit_hash ? `**Prediction commit**: \`${mission.commit_hash}\`` : null,
    mission?.revealed_at && mission?.commit_salt
      ? `**Revealed**: ${mission.revealed_at} (salt \`${mission.commit_salt}\`)`
      : null,
    head("Synthesis"),
    synthesisBlock || "_No synthesis document available._",
    head("Theses"),
    thesesBlock || "_No theses produced._",
    upBlock("uniprot", "Sequence & Structure (UniProt)"),
    upBlock("opentargets", "Target & Pathway (OpenTargets)"),
    upBlock("chembl", "Variant Linker (ChEMBL)"),
    upBlock("admet_card", "ADMET Developability"),
    upBlock("novelty", "Novelty Whitespace"),
    upBlock("patent_signal", "Patent Landscape"),
    head(`PubMed Citations (${pubmed.length})`),
    pubmedBlock || "_No PubMed citations._",
    head("Notice"),
    "_Pepclaw produces nonclinical research artefacts only. No human-use claim is made or implied._",
  ]
    .filter(Boolean)
    .join("\n");

  addDossier({
    mission_id: ctx.missionId,
    title: `Dossier · ${(mission?.query ?? ctx.query).slice(0, 60)}`,
    content: md,
    doc_type: "dossier",
  });

  return { summary: `Dossier assembled (${md.length} chars · ${pubmed.length} PMIDs cited)` };
}

function safeJson<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}
