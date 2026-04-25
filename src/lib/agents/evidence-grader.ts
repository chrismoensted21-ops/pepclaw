import { listFindings } from "../repo";
import { getDb } from "../db";
import type { AgentContext } from "./index";
import type { EvidenceGrade } from "../types";

/**
 * Refines evidence grades on existing findings using a small rubric:
 * - Source type weight (pubmed/clinical > review > opinion)
 * - Replication signal (same target appearing in ≥N findings)
 * - Recency
 */
export async function runEvidenceGrader(ctx: AgentContext) {
  const findings = listFindings(ctx.missionId);
  const targetCounts = new Map<string, number>();
  for (const f of findings) {
    if (f.target) targetCounts.set(f.target, (targetCounts.get(f.target) ?? 0) + 1);
  }

  const db = getDb();
  const update = db.prepare(`UPDATE findings SET evidence_grade = ? WHERE id = ?`);
  let updated = 0;
  for (const f of findings) {
    const newGrade = grade(f.source_type, f.metadata, targetCounts.get(f.target ?? "") ?? 0);
    if (newGrade && newGrade !== f.evidence_grade) {
      update.run(newGrade, f.id);
      updated++;
    }
  }
  return { summary: `${updated} findings re-graded by evidence rubric` };
}

function grade(
  sourceType: string,
  metadataJson: string | null,
  replication: number
): EvidenceGrade | null {
  const meta = safeJson<{ pubTypes?: string[]; year?: number; knownLigands?: number; novelty?: number }>(
    metadataJson
  );
  const types = (meta?.pubTypes ?? []).map((t) => t.toLowerCase());
  const recent = meta?.year && meta.year >= new Date().getFullYear() - 5;

  if (sourceType === "pubmed") {
    if (types.some((t) => t.includes("randomized") || t.includes("phase iii") || t.includes("meta-analysis"))) return "A";
    if (types.some((t) => t.includes("clinical trial"))) return replication >= 2 ? "A" : "B";
    if (types.some((t) => t.includes("review")) && recent) return replication >= 2 ? "B" : "C";
    if (types.some((t) => t.includes("editorial") || t.includes("comment"))) return "D";
    return replication >= 3 ? "B" : "C";
  }
  if (sourceType === "uniprot") return "A";
  if (sourceType === "alphafold") return "A";
  if (sourceType === "opentargets") return "B";
  if (sourceType === "chembl") return (meta?.knownLigands ?? 0) > 100 ? "B" : "C";
  if (sourceType === "novelty") return (meta?.novelty ?? 0) > 0.85 ? "A" : "B";
  if (sourceType === "patent_signal") return "B";
  if (sourceType === "admet_card") return "B";
  return null;
}

function safeJson<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}
