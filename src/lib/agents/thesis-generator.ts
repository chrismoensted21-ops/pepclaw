import { listFindings, addThesis } from "../repo";
import { chat, tryParseJson } from "../llm";
import type { AgentContext } from "./index";
import type { EvidenceGrade } from "../types";

interface ThesisJson {
  title?: string;
  hypothesis?: string;
  mechanism?: string;
  target?: string;
  conviction?: number;
  evidence_grade?: string;
  evidence_summary?: string;
}

export async function runThesisGenerator(ctx: AgentContext) {
  const findings = listFindings(ctx.missionId);
  if (findings.length === 0) {
    return { summary: "No findings available; thesis generation skipped." };
  }

  const top = findings
    .filter((f) => f.evidence_grade === "A" || f.evidence_grade === "B")
    .slice(0, 14);
  const corpus = top.length > 0 ? top : findings.slice(0, 14);

  const evidenceBlock = corpus
    .map((f, i) => `[${i + 1}] (${f.evidence_grade ?? "?"} ${f.source_ref}) ${f.title ?? "(no title)"}: ${truncate(f.content, 320)}`)
    .join("\n");

  const sys = `You are the Thesis Generator agent inside an autonomous peptide research swarm. You produce ONE structured, falsifiable hypothesis per call. Output strict JSON only with keys: title, hypothesis, mechanism, target, conviction (0-1), evidence_grade (A|B|C|D), evidence_summary. Be concrete. The mechanism must reference specific molecular interactions. Conviction must reflect the actual evidence quality, not optimism.`;

  const user = `Mission query: ${ctx.query}
Target class: ${ctx.targetClass ?? "(unspecified)"}

Evidence corpus from upstream pools:
${evidenceBlock}

Compose ONE engineered-peptide thesis grounded in this evidence. Reply with strict JSON.`;

  const llm = await chat({
    messages: [
      { role: "system", content: sys },
      { role: "user", content: user },
    ],
    jsonMode: true,
    effort: "high",
  });

  const parsed = tryParseJson<ThesisJson>(llm.text);
  const title =
    parsed?.title?.trim() ||
    `Engineered peptide thesis · ${ctx.targetClass ?? extractTargetFromCorpus(corpus) ?? "candidate"}`;
  const hypothesis =
    parsed?.hypothesis?.trim() ||
    `A rationally engineered peptide variant — derived from the convergent signals across literature, structure and target/pathway pools — will increase target engagement vs. the reference scaffold while maintaining acceptable developability.`;
  const mechanism = parsed?.mechanism?.trim() ?? null;
  const target = parsed?.target?.trim() ?? ctx.targetClass ?? extractTargetFromCorpus(corpus);
  const conviction = clamp01(Number(parsed?.conviction ?? 0.55));
  const grade = normalizeGrade(parsed?.evidence_grade) ?? "B";
  const summary =
    parsed?.evidence_summary?.trim() ||
    `Built from ${corpus.length} pool findings (${corpus.filter((c) => c.evidence_grade === "A").length} grade-A).`;

  addThesis({
    mission_id: ctx.missionId,
    title,
    hypothesis,
    mechanism,
    target,
    evidence_summary: summary,
    conviction,
    evidence_grade: grade,
    status: "draft",
  });

  return {
    summary: `Thesis generated (conviction ${conviction.toFixed(2)}, grade ${grade}, ${llm.usedFallback ? "fallback" : llm.model})`,
  };
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0.5;
  return Math.max(0, Math.min(1, n));
}

function normalizeGrade(g?: string): EvidenceGrade | null {
  if (!g) return null;
  const u = g.trim().toUpperCase();
  if (u === "A" || u === "B" || u === "C" || u === "D" || u === "X") return u;
  return null;
}

function extractTargetFromCorpus(
  findings: { target: string | null }[]
): string | null {
  const counts = new Map<string, number>();
  for (const f of findings) {
    if (f.target) counts.set(f.target, (counts.get(f.target) ?? 0) + 1);
  }
  let best: string | null = null;
  let n = 0;
  for (const [t, c] of counts) if (c > n) ((best = t), (n = c));
  return best;
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
