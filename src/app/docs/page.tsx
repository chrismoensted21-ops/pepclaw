import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { ALL_POOLS, POOL_DESC, POOL_LABEL, POOL_TIER } from "@/lib/types";

export const metadata = { title: "Docs — Pepclaw" };

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "agents", label: "Agent pools" },
  { id: "commit-reveal", label: "Commit / reveal" },
  { id: "evidence-grading", label: "Evidence grading" },
  { id: "sources", label: "Data sources" },
  { id: "dossiers", label: "Dossier shape" },
  { id: "api", label: "API reference" },
  { id: "kie", label: "kie.ai integration" },
];

export default function DocsPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black text-ink-100">
      <SiteNav active="docs" />
      <div className="absolute right-0 top-32 -z-10 h-[420px] w-[420px] rounded-full bg-plum-700/[0.08] blur-3xl" />
      <div className="container pt-32 pb-20 grid gap-12 lg:grid-cols-[220px,1fr]">
        <aside className="hidden lg:block">
          <nav className="sticky top-28 space-y-1">
            <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-plum-300">
              Documentation
            </div>
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block rounded-full px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-200 transition-colors hover:bg-plum-500/[0.06] hover:text-plum-200"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        <article className="space-y-20 max-w-3xl">
          <Overview />
          <Agents />
          <CommitReveal />
          <Grading />
          <Sources />
          <Dossiers />
          <Api />
          <Kie />
        </article>
      </div>
      <SiteFooter />
    </main>
  );
}

function H({ id, kicker, title }: { id: string; kicker: string; title: string }) {
  return (
    <header className="border-b border-plum-500/10 pb-5">
      <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-plum-300">
        <span className="h-px w-6 bg-plum-500/40" />
        {kicker}
      </span>
      <h2
        id={id}
        className="mt-3 font-serif text-[clamp(32px,4vw,48px)] leading-tight tracking-tight text-white"
      >
        {title}
      </h2>
    </header>
  );
}

function Overview() {
  return (
    <section>
      <H id="overview" kicker="Overview" title="Pepclaw is a research swarm." />
      <p className="mt-6 leading-relaxed text-ink-200">
        Pepclaw is an autonomous research swarm for nonclinical peptide discovery.
        It runs <em>missions</em> — bounded, single-question research jobs — and
        emits <em>dossiers</em> — buyer-safe, citation-anchored deliverables.
      </p>
      <p className="mt-4 leading-relaxed text-ink-200">
        Every mission goes through a 5-layer DAG of agent pools. Layer 1
        ingests evidence; layer 2 annotates and scouts novelty; layer 3 grades
        evidence A → X; layer 4 reasons + critiques; layer 5 synthesizes the
        dossier. The dossier never assumes more than the evidence allows.
      </p>
    </section>
  );
}

function Agents() {
  return (
    <section>
      <H id="agents" kicker="Architecture" title="The 12 agent pools." />
      <ul className="mt-8 space-y-3">
        {ALL_POOLS.map((p) => (
          <li key={p} className="rounded-xl border border-plum-500/10 bg-white/[0.015] p-5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-serif text-xl text-white">{POOL_LABEL[p]}</span>
              <span className="font-mono text-[9.5px] uppercase tracking-widest text-plum-200/80">
                {POOL_TIER[p]} · {p}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-300">{POOL_DESC[p]}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CommitReveal() {
  return (
    <section>
      <H id="commit-reveal" kicker="Protocol" title="Commit / reveal — tamper-evident questions." />
      <p className="mt-6 leading-relaxed text-ink-200">
        Before any agent runs, Pepclaw computes:
      </p>
      <pre className="mt-4 overflow-x-auto rounded-xl border border-plum-500/15 bg-black/60 p-5 font-mono text-[12px] leading-relaxed text-ink-200">
{`message = JSON.stringify({
  query: "...",
  target_class: "...",
  schema: "pepclaw.commit.v1",
  salt: <random 16 bytes hex>,
});

commit_hash = sha256(message);   // public, written to mission row immediately
commit_salt = <salt>;            // private until the mission completes`}
      </pre>
      <p className="mt-4 leading-relaxed text-ink-200">
        On completion, Pepclaw publishes the salt. Anyone can re-hash the
        original question + salt and verify the run was honest end-to-end. If a
        mission is aborted before completion, the salt remains sealed and the
        commit hash stays as a public commitment that no answer was ever
        delivered for that question.
      </p>
    </section>
  );
}

function Grading() {
  return (
    <section>
      <H id="evidence-grading" kicker="Quality" title="Evidence grading — A through X." />
      <p className="mt-6 leading-relaxed text-ink-200">
        Every finding is graded with an explicit rubric. The rubric is shipped
        with Pepclaw, not learned, and not opaque.
      </p>
      <table className="mt-6 w-full border-collapse">
        <thead>
          <tr className="border-b border-plum-500/15 text-left">
            <th className="py-2 font-mono text-[10px] uppercase tracking-widest text-ink-300">
              Grade
            </th>
            <th className="py-2 font-mono text-[10px] uppercase tracking-widest text-ink-300">
              Meaning
            </th>
          </tr>
        </thead>
        <tbody className="text-sm leading-relaxed">
          {[
            ["A", "Multiple independent peer-reviewed studies, replicated, with concordant readouts."],
            ["B", "Single peer-reviewed study with rigorous methodology, or strong concordance from indirect sources."],
            ["C", "Preprint, conference, or single-method evidence; plausible but not replicated."],
            ["D", "Indirect inference, weak methodology, or fragile single-source claim."],
            ["X", "Insufficient or contradictory evidence; cannot ground a thesis."],
          ].map(([g, d]) => (
            <tr key={g} className="border-b border-plum-500/10">
              <td className="py-2 pr-4 font-serif text-lg text-white">{g}</td>
              <td className="py-2 text-ink-200">{d}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Sources() {
  return (
    <section>
      <H id="sources" kicker="Data" title="Data sources — real, not mocked." />
      <ul className="mt-6 grid gap-2.5 md:grid-cols-2">
        {[
          ["PubMed (NCBI E-utilities)", "esearch + efetch, PMID-anchored citations"],
          ["UniProt", "Protein entries, taxonomy, function annotations"],
          ["AlphaFold", "Predicted structures and pLDDT confidence per residue"],
          ["OpenTargets GraphQL", "Target ↔ disease associations + therapeutic areas"],
          ["ChEMBL REST", "Targets, ligands, bioactivity priors"],
          ["Reactome", "Pathway membership and cross-references"],
          ["Lens.org Patents", "Whitespace and freedom-to-operate signals (pending)"],
          ["ClinicalTrials.gov", "Trial landscape (future)"],
        ].map(([k, v]) => (
          <li key={k} className="rounded-xl border border-plum-500/10 bg-white/[0.015] p-5">
            <div className="font-serif text-[16px] text-white">{k}</div>
            <div className="mt-1 text-sm text-ink-300">{v}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Dossiers() {
  return (
    <section>
      <H id="dossiers" kicker="Output" title="Dossier shape — buyer-safe markdown." />
      <p className="mt-6 leading-relaxed text-ink-200">
        Every dossier follows the same skeleton, by construction:
      </p>
      <pre className="mt-4 overflow-x-auto rounded-xl border border-plum-500/15 bg-black/60 p-5 font-mono text-[12px] leading-relaxed text-ink-200">
{`## Question
<the original mission query, verbatim>

## Cross-pool consensus
- Literature ...
- Sequence/structure ...
- Target/pathway ...
- ChEMBL ligand prior ...

## Open questions
## Risks
## Recommended next steps`}
      </pre>
      <p className="mt-4 leading-relaxed text-ink-200">
        The dossier is deterministic given the upstream evidence. It does not
        invent claims, does not embed PMIDs that weren't retrieved, and never
        makes a human-use claim.
      </p>
    </section>
  );
}

function Api() {
  return (
    <section>
      <H id="api" kicker="Reference" title="HTTP API." />
      <ul className="mt-6 space-y-4 text-sm">
        {[
          { m: "POST", p: "/api/missions", d: "Start a mission. Body: { query, target_class?, depth?, budget_cents? }. Returns 202 + mission_id." },
          { m: "GET", p: "/api/missions", d: "List missions, latest 50." },
          { m: "GET", p: "/api/missions/:id", d: "Mission state: tasks, findings, theses, critiques, dossiers." },
          { m: "GET", p: "/api/dashboard?mission_id=…", d: "Aggregated dashboard payload (the same one /app uses)." },
          { m: "GET", p: "/api/stream?mission_id=…", d: "Server-Sent Events feed of swarm events. Heartbeats every ~700ms." },
        ].map((r) => (
          <li key={r.p} className="grid grid-cols-[60px,1fr] items-baseline gap-3 rounded-xl border border-plum-500/10 bg-white/[0.015] p-5">
            <span className="font-mono text-[11px] uppercase tracking-widest text-plum-200">
              {r.m}
            </span>
            <div>
              <code className="font-mono text-[13px] text-white">{r.p}</code>
              <div className="mt-1 text-ink-300">{r.d}</div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Kie() {
  return (
    <section>
      <H id="kie" kicker="Reasoning" title="kie.ai integration." />
      <p className="mt-6 leading-relaxed text-ink-200">
        Pepclaw's reasoning agents — Thesis Generator, Red Team and Synthesizer
        — call <code>POST https://api.kie.ai/codex/v1/responses</code> with model{" "}
        <code>gpt-5-4</code>. Reasoning effort is configurable per call (low →
        xhigh).
      </p>
      <pre className="mt-4 overflow-x-auto rounded-xl border border-plum-500/15 bg-black/60 p-5 font-mono text-[12px] leading-relaxed text-ink-200">
{`POST https://api.kie.ai/codex/v1/responses
authorization: Bearer $KIE_API_KEY
content-type: application/json

{
  "model": "gpt-5-4",
  "stream": false,
  "input": [
    { "role": "user", "content": [{ "type": "input_text", "text": "..." }] }
  ],
  "reasoning": { "effort": "medium" }
}`}
      </pre>
      <p className="mt-4 leading-relaxed text-ink-200">
        If <code>KIE_API_KEY</code> is not set, Pepclaw transparently falls back
        to deterministic templated reasoning so the swarm still ships dossiers
        end-to-end. The mission ledger marks any fallback runs explicitly so
        replays can distinguish &ldquo;model output&rdquo; from
        &ldquo;deterministic stub&rdquo;.
      </p>
    </section>
  );
}
