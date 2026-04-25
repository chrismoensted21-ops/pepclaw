import { searchAndFetch } from "../sources/pubmed";
import { addFinding } from "../repo";
import type { AgentContext } from "./index";
import type { EvidenceGrade } from "../types";

export async function runLiteratureMiner(ctx: AgentContext) {
  const query = buildPubmedQuery(ctx.query, ctx.targetClass);
  const hits = await searchAndFetch(query, 12).catch(() => []);
  let added = 0;
  for (const h of hits) {
    const grade = preGradeByPubType(h.pubTypes);
    addFinding({
      mission_id: ctx.missionId,
      task_id: ctx.taskId,
      pool: "literature_miner",
      source_type: "pubmed",
      source_ref: `pubmed:${h.pmid}`,
      title: h.title,
      content: truncate(h.abstract || h.title, 1800),
      url: h.url,
      relevance_score: scoreRelevance(ctx.query, h.title, h.abstract),
      evidence_grade: grade,
      target: ctx.targetClass,
      metadata: {
        authors: h.authors,
        journal: h.journal,
        year: h.year,
        doi: h.doi,
        pubTypes: h.pubTypes,
        mesh: h.mesh,
      },
    });
    added++;
  }
  return { summary: `${added} PubMed findings ingested for "${query.slice(0, 60)}"` };
}

function buildPubmedQuery(userQuery: string, targetClass: string | null): string {
  const base = userQuery.trim();
  const target = targetClass?.trim();
  const peptidey = /peptide|polypeptide|protein/i.test(base) ? "" : " AND (peptide OR therapeutic)";
  if (target && !base.toLowerCase().includes(target.toLowerCase())) {
    return `(${base}) AND (${target})${peptidey}`;
  }
  return `${base}${peptidey}`;
}

function preGradeByPubType(types: string[]): EvidenceGrade {
  const t = types.map((x) => x.toLowerCase());
  if (t.some((x) => x.includes("randomized") || x.includes("clinical trial, phase iii"))) return "A";
  if (t.some((x) => x.includes("meta-analysis") || x.includes("systematic review"))) return "A";
  if (t.some((x) => x.includes("clinical trial"))) return "B";
  if (t.some((x) => x.includes("review"))) return "C";
  if (t.some((x) => x.includes("comment") || x.includes("editorial") || x.includes("letter"))) return "D";
  return "C";
}

function scoreRelevance(query: string, title: string, abstract: string): number {
  const q = query.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  if (q.length === 0) return 0.5;
  const blob = (title + " " + abstract).toLowerCase();
  let hits = 0;
  for (const w of q) if (blob.includes(w)) hits++;
  return Math.min(1, hits / q.length);
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
