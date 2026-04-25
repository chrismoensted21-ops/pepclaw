import { listFindings, listTheses, listCritiques, addDossier } from "../repo";
import { chat } from "../llm";
import type { AgentContext } from "./index";

export async function runSynthesizer(ctx: AgentContext) {
  const [findings, theses, critiques] = await Promise.all([
    listFindings(ctx.missionId),
    listTheses(ctx.missionId),
    listCritiques(ctx.missionId),
  ]);

  const summarized = findings
    .slice(0, 30)
    .map((f) => `- (${f.evidence_grade ?? "?"} ${f.source_ref}) ${f.title ?? ""}`)
    .join("\n");
  const thesesBlock = theses
    .map((t) => `- [${t.evidence_grade ?? "?"} c=${t.conviction?.toFixed(2) ?? "?"}] ${t.title}: ${t.hypothesis}`)
    .join("\n");
  const critiquesBlock = critiques
    .map((c) => `- ${c.persona}/${c.severity}: ${c.specific_concern}`)
    .join("\n");

  const sys = `You are the Synthesizer agent. Produce a high-density cross-pool synthesis in markdown. Sections: ## Question, ## Cross-pool consensus, ## Open questions, ## Risks, ## Recommended next steps. No invented PMIDs. Reference findings by source_ref where useful.`;
  const user = `Mission query: ${ctx.query}
Target class: ${ctx.targetClass ?? "(unspecified)"}

Findings (top ${Math.min(findings.length, 30)}):
${summarized}

Theses:
${thesesBlock || "(none)"}

Red-team critiques:
${critiquesBlock || "(none)"}`;

  const out = await chat({
    messages: [
      { role: "system", content: sys },
      { role: "user", content: user },
    ],
    effort: "medium",
  });

  const content = out.text || "(synthesis produced no content)";
  await addDossier({
    mission_id: ctx.missionId,
    title: `Synthesis · ${ctx.query.slice(0, 60)}`,
    content,
    doc_type: "synthesis",
  });

  return { summary: `Synthesis written (${content.length} chars, ${out.usedFallback ? "fallback" : out.model})` };
}
