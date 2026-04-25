/**
 * Agent registry. Each pool exports a `run(ctx)` function.
 */
import type { AgentPool } from "../types";
import { runLiteratureMiner } from "./literature-miner";
import { runSequenceStructure } from "./sequence-structure";
import { runTargetPathway } from "./target-pathway";
import { runVariantLinker } from "./variant-linker";
import { runAdmet } from "./admet";
import { runNoveltyScout } from "./novelty-scout";
import { runPatentCompetitive } from "./patent-competitive";
import { runEvidenceGrader } from "./evidence-grader";
import { runThesisGenerator } from "./thesis-generator";
import { runRedTeam } from "./red-team";
import { runSynthesizer } from "./synthesizer";
import { runDossierAssembler } from "./dossier-assembler";

export interface AgentContext {
  missionId: string;
  query: string;
  targetClass: string | null;
  taskId: string;
  agentIndex: number;
}

export type AgentRunner = (ctx: AgentContext) => Promise<{ summary?: string; cost_cents?: number }>;

export const AGENT_RUNNERS: Record<AgentPool, AgentRunner> = {
  literature_miner: runLiteratureMiner,
  sequence_structure: runSequenceStructure,
  target_pathway: runTargetPathway,
  variant_linker: runVariantLinker,
  admet_developability: runAdmet,
  novelty_scout: runNoveltyScout,
  patent_competitive: runPatentCompetitive,
  evidence_grader: runEvidenceGrader,
  thesis_generator: runThesisGenerator,
  red_team: runRedTeam,
  synthesizer: runSynthesizer,
  dossier_assembler: runDossierAssembler,
};
