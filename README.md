# Pepclaw

Autonomous peptide research swarm. Twelve specialist agent pools, real
biomedical data, tamper-evident commit-and-reveal protocol — every claim
hashed before the run, revealed after, verifiable forever.

## Stack

- **Next.js 15** + **React 19** + **TypeScript**
- **SQLite** via `better-sqlite3` (WAL, foreign keys on)
- **kie.ai GPT-5.4** for reasoning agents (Thesis Generator, Red Team, Synthesizer)
- **Tailwind CSS** + Framer Motion + Radix UI
- **Server-Sent Events** (`/api/stream`) for live Mission Control
- Public biomedical APIs: PubMed E-utilities, UniProt, AlphaFold, OpenTargets,
  ChEMBL, Reactome

## Getting started

```bash
npm install
cp .env.example .env.local      # paste your KIE_API_KEY (optional — fallback exists)
npm run dev                     # http://localhost:3000
```

Without `KIE_API_KEY`, reasoning agents use a deterministic templated fallback
so the swarm still runs end-to-end. With it, all reasoning hits
`POST https://api.kie.ai/codex/v1/responses` with `model=gpt-5-4` and
configurable `reasoning.effort`.

## Pages

- `/` — Landing. Tells the whole story.
- `/app` — Mission Control. Live ops cockpit with twelve panels (live mission,
  swarm graph, pipeline, evidence, sources, deliverables, recent runs, findings
  feed, theses ledger, critiques, dossier preview).
- `/roadmap` — Phased execution plan.
- `/docs` — Architecture, agents, commit/reveal protocol, evidence rubric, data
  sources, dossier shape, REST API, kie.ai integration.

## API

| Method | Path                         | Purpose                            |
| ------ | ---------------------------- | ---------------------------------- |
| GET    | `/api/dashboard`             | Aggregated dashboard payload       |
| GET    | `/api/missions`              | List missions                      |
| POST   | `/api/missions`              | Start a new mission                |
| GET    | `/api/missions/[id]`         | Mission detail (tasks, findings, …)|
| GET    | `/api/stream`                | SSE swarm event stream             |

## Architecture (high level)

```
Orchestrator (5-layer DAG)
  ├── upstream pools     (real APIs, evidence ingestion)
  │     · Literature Miner       PubMed E-utilities
  │     · Sequence & Structure   UniProt + PDB + AlphaFold
  │     · Target & Pathway       OpenTargets + Reactome
  │     · Variant Linker         ChEMBL
  │     · ADMET Developability   heuristic scorecards
  ├── reasoning pools    (kie.ai GPT-5.4 + grading rubric)
  │     · Novelty Scout          whitespace detection
  │     · Patent Competitive     patent landscape
  │     · Thesis Generator       falsifiable hypothesis
  │     · Evidence Grader        A | B | C | D | X
  │     · Red Team               skeptic / scientist / senior_reviewer
  └── output pools       (synthesis & dossier)
        · Synthesizer            cross-pool consensus
        · Dossier Assembler      buyer-safe markdown
```

Every mission commits `sha256(query, target_class, schema, salt)` before any
agent runs and reveals `salt` only when the mission completes. Anyone can
re-hash the original question and verify the run was honest end-to-end.

## License

Research only — no human-use claim.
