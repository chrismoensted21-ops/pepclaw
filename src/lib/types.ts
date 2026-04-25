export type MissionStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "paused";

export type TaskStatus = "queued" | "running" | "completed" | "failed" | "skipped";

export type EvidenceGrade = "A" | "B" | "C" | "D" | "X";

export type CritiquePersona = "skeptic" | "scientist" | "senior_reviewer";

export type CritiqueSeverity = "info" | "warning" | "block";

export type DepthLevel = "scout" | "standard" | "deep";

export type AgentPool =
  | "literature_miner"
  | "sequence_structure"
  | "target_pathway"
  | "variant_linker"
  | "admet_developability"
  | "novelty_scout"
  | "patent_competitive"
  | "thesis_generator"
  | "evidence_grader"
  | "red_team"
  | "synthesizer"
  | "dossier_assembler";

export interface Mission {
  id: string;
  query: string;
  target_class: string | null;
  depth: DepthLevel;
  status: MissionStatus;
  budget_cents: number;
  spent_cents: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  failure_reason: string | null;
  commit_hash: string | null;
  commit_salt: string | null;
  revealed_at: string | null;
}

export interface Task {
  id: string;
  mission_id: string;
  pool: AgentPool;
  agent_index: number;
  status: TaskStatus;
  input: string | null;
  output: string | null;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Finding {
  id: string;
  mission_id: string;
  task_id: string | null;
  pool: AgentPool;
  source_type: string;
  source_ref: string;
  title: string | null;
  content: string;
  url: string | null;
  relevance_score: number | null;
  evidence_grade: EvidenceGrade | null;
  target: string | null;
  metadata: string | null;
  created_at: string;
}

export interface Thesis {
  id: string;
  mission_id: string;
  title: string;
  hypothesis: string;
  mechanism: string | null;
  target: string | null;
  evidence_summary: string | null;
  conviction: number | null;
  evidence_grade: EvidenceGrade | null;
  status: string;
  created_at: string;
}

export interface Critique {
  id: string;
  mission_id: string;
  thesis_id: string | null;
  persona: CritiquePersona;
  severity: CritiqueSeverity;
  category: string | null;
  specific_concern: string;
  suggested_fix: string | null;
  blocks: number;
  created_at: string;
}

export interface Dossier {
  id: string;
  mission_id: string;
  title: string;
  content: string;
  content_chars: number;
  doc_type: "synthesis" | "dossier";
  created_at: string;
}

export interface SwarmEvent {
  id: number;
  mission_id: string | null;
  kind: string;
  pool: AgentPool | null;
  payload: string | null;
  created_at: string;
}

export const ALL_POOLS: AgentPool[] = [
  "literature_miner",
  "sequence_structure",
  "target_pathway",
  "variant_linker",
  "admet_developability",
  "novelty_scout",
  "patent_competitive",
  "thesis_generator",
  "evidence_grader",
  "red_team",
  "synthesizer",
  "dossier_assembler",
];

export const POOL_LABEL: Record<AgentPool, string> = {
  literature_miner: "Literature Miner",
  sequence_structure: "Sequence & Structure",
  target_pathway: "Target & Pathway",
  variant_linker: "Variant Linker",
  admet_developability: "ADMET Developability",
  novelty_scout: "Novelty Scout",
  patent_competitive: "Patent Competitive",
  thesis_generator: "Thesis Generator",
  evidence_grader: "Evidence Grader",
  red_team: "Red Team",
  synthesizer: "Synthesizer",
  dossier_assembler: "Dossier Assembler",
};

export const POOL_TIER: Record<AgentPool, "upstream" | "reasoning" | "output"> = {
  literature_miner: "upstream",
  sequence_structure: "upstream",
  target_pathway: "upstream",
  variant_linker: "upstream",
  admet_developability: "upstream",
  novelty_scout: "reasoning",
  patent_competitive: "reasoning",
  thesis_generator: "reasoning",
  evidence_grader: "reasoning",
  red_team: "reasoning",
  synthesizer: "output",
  dossier_assembler: "output",
};

export const POOL_DESC: Record<AgentPool, string> = {
  literature_miner:
    "PubMed E-utilities. Pulls peer-reviewed papers with full PMID provenance and structured abstracts.",
  sequence_structure:
    "UniProt + PDB + AlphaFold. Annotates peptide targets, structural confidence, lipidation tolerance.",
  target_pathway:
    "OpenTargets GraphQL + Reactome. Maps targets to diseases and mechanism-of-action pathways.",
  variant_linker:
    "ChEMBL REST. Links targets to known small molecules and binding-assay endpoints.",
  admet_developability:
    "Heuristic ADMET scorecards: solubility, half-life, peptide developability, off-target risk.",
  novelty_scout:
    "Whitespace detector. Scores each finding for novelty against historical mission corpus.",
  patent_competitive:
    "Patent landscape and freedom-to-operate surveillance via Lens.org-compatible signals.",
  thesis_generator:
    "Composes structured, falsifiable hypotheses with evidence-cited mechanism claims.",
  evidence_grader:
    "Grades each finding A/B/C/D/X using study type, replication and reporting strength.",
  red_team:
    "Three personas — Skeptic / Scientist / Senior Reviewer. Only Senior can issue a hard block.",
  synthesizer:
    "Consolidates cross-pool findings and theses into the synthesis document.",
  dossier_assembler:
    "Buyer-safe markdown dossier with PMID citations, hedged claims and full evidence chain.",
};
