import { addFinding, listFindings } from "../repo";
import type { AgentContext } from "./index";

/**
 * Heuristic ADMET / developability scorecards.
 * Real ADMET predictors (admetSAR, ADMETLab) are paywalled or rate-limited; we score
 * heuristically from sequence properties present in upstream findings.
 */
export async function runAdmet(ctx: AgentContext) {
  const seqFindings = listFindings(ctx.missionId).filter((f) => f.pool === "sequence_structure");
  let added = 0;
  for (const sf of seqFindings.slice(0, 4)) {
    const meta = safeJson<Record<string, unknown>>(sf.metadata);
    const seqHead = String(meta?.sequence_head ?? "");
    const card = score(seqHead);
    addFinding({
      mission_id: ctx.missionId,
      task_id: ctx.taskId,
      pool: "admet_developability",
      source_type: "admet_card",
      source_ref: `admet:${sf.source_ref}`,
      title: `ADMET scorecard · ${sf.title ?? sf.source_ref}`,
      content: [
        `Hydrophobicity index: ${card.hydrophobicity.toFixed(2)}`,
        `Net charge (estimated): ${card.netCharge}`,
        `Protease risk: ${card.proteaseRisk}`,
        `Half-life class (estimated): ${card.halfLife}`,
        `Developability: ${card.developability}`,
      ].join("\n"),
      url: null,
      relevance_score: card.score,
      evidence_grade: card.score > 0.7 ? "B" : "C",
      target: sf.target,
      metadata: card,
    });
    added++;
  }
  return { summary: `${added} ADMET scorecards generated` };
}

function score(seq: string): {
  hydrophobicity: number;
  netCharge: number;
  proteaseRisk: string;
  halfLife: string;
  developability: string;
  score: number;
} {
  const s = seq.toUpperCase();
  const hydroAA = /[AILMFWVY]/g;
  const positive = /[KRH]/g;
  const negative = /[DE]/g;
  const proteaseRiskAA = /[RK]{2,}|[PG]{3,}/;

  const len = s.length || 1;
  const hydroCount = (s.match(hydroAA) ?? []).length;
  const pos = (s.match(positive) ?? []).length;
  const neg = (s.match(negative) ?? []).length;

  const hydro = hydroCount / len;
  const netCharge = pos - neg;
  const proteaseRisk = proteaseRiskAA.test(s) ? "Elevated" : "Baseline";
  const halfLife =
    netCharge < -2 ? "Short (<1h)" : Math.abs(netCharge) <= 2 ? "Moderate (1–6h)" : "Improvable with lipidation";
  const dev = hydro > 0.65 ? "Aggregation-prone" : hydro < 0.2 ? "Highly polar" : "Balanced";
  const sc = clamp01(0.4 + (hydro > 0.25 && hydro < 0.55 ? 0.2 : 0) + (Math.abs(netCharge) <= 3 ? 0.2 : 0) + (proteaseRisk === "Baseline" ? 0.2 : 0));
  return { hydrophobicity: hydro, netCharge, proteaseRisk, halfLife, developability: dev, score: sc };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function safeJson<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}
