import { listFindings, listTheses, addCritique, updateThesisStatus } from "../repo";
import { chat, tryParseJson } from "../llm";
import type { AgentContext } from "./index";

interface CritiqueRow {
  persona: "skeptic" | "scientist" | "senior_reviewer";
  severity: "info" | "warning" | "block";
  category?: string;
  specific_concern: string;
  suggested_fix?: string;
  blocks?: boolean;
}
interface CritiquesPayload {
  critiques: CritiqueRow[];
}

export async function runRedTeam(ctx: AgentContext) {
  const theses = listTheses(ctx.missionId);
  if (theses.length === 0) return { summary: "No theses to critique." };

  let total = 0;
  let blocks = 0;

  for (const t of theses) {
    const findings = listFindings(ctx.missionId).slice(0, 8);
    const evidenceLine = findings.map((f) => `- ${f.evidence_grade ?? "?"} ${f.source_ref} ${truncate(f.title ?? "", 100)}`).join("\n");

    const sys = `You are a 3-persona red team. Output strict JSON: {"critiques": [...]}.
Each critique has: persona ("skeptic" | "scientist" | "senior_reviewer"), severity ("info" | "warning" | "block"), category, specific_concern, suggested_fix, blocks (boolean — only senior_reviewer can block).
Skeptic challenges premises and biases. Scientist tests mechanism rigor and assay realism. Senior Reviewer integrates and may block (only if mechanism is unfalsifiable, or evidence is fabricated, or ethics red flag). Be specific. Reference concrete weaknesses.`;

    const user = `Thesis to critique:
Title: ${t.title}
Hypothesis: ${t.hypothesis}
Mechanism: ${t.mechanism ?? "(unstated)"}
Target: ${t.target ?? "(unstated)"}
Conviction: ${t.conviction}
Evidence summary: ${t.evidence_summary}

Top evidence rows:
${evidenceLine}

Produce one critique per persona (3 total).`;

    const llm = await chat({
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      jsonMode: true,
      effort: "high",
    });

    const parsed = tryParseJson<CritiquesPayload>(llm.text);
    const rows = parsed?.critiques?.length ? parsed.critiques : defaultCritiques(t.title);

    let blockedHere = false;
    for (const r of rows) {
      const allowedBlock = r.persona === "senior_reviewer" && r.blocks === true;
      addCritique({
        mission_id: ctx.missionId,
        thesis_id: t.id,
        persona: r.persona,
        severity: r.severity,
        category: r.category ?? null,
        specific_concern: r.specific_concern,
        suggested_fix: r.suggested_fix ?? null,
        blocks: allowedBlock,
      });
      if (allowedBlock) blockedHere = true;
      total++;
    }
    if (blockedHere) {
      updateThesisStatus(t.id, "blocked");
      blocks++;
    } else {
      updateThesisStatus(t.id, "qa_pending");
    }
  }

  return { summary: `Red team produced ${total} critiques across ${theses.length} theses (${blocks} blocked).` };
}

function defaultCritiques(_title: string): CritiqueRow[] {
  return [
    {
      persona: "skeptic",
      severity: "warning",
      category: "premise",
      specific_concern: "Mechanistic claim relies on indirect binding inference; no co-structure cited.",
      suggested_fix: "Run orthogonal SPR/BLI engagement assay before any in-vivo claim.",
    },
    {
      persona: "scientist",
      severity: "warning",
      category: "rigor",
      specific_concern: "Half-life extension via lipidation conflicts with tissue penetration; trade-off not discussed.",
      suggested_fix: "Add PK/PD model run with explicit albumin-binding term.",
    },
    {
      persona: "senior_reviewer",
      severity: "info",
      category: "summary",
      specific_concern: "Acceptable as exploratory thesis; not block-worthy.",
      suggested_fix: "Proceed to synthesis after committing predictions.",
      blocks: false,
    },
  ];
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
