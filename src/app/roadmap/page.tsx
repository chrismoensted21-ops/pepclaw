import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { cn } from "@/lib/utils";

export const metadata = { title: "Roadmap — Pepclaw" };

interface Milestone {
  q: string;
  status: "shipped" | "in_progress" | "next" | "future";
  title: string;
  body: string;
  bullets: string[];
}

const PHASES: { id: string; head: string; sub: string; rows: Milestone[] }[] = [
  {
    id: "p0",
    head: "Phase 0 — Foundation",
    sub: "The kernel that everything sits on top of.",
    rows: [
      {
        q: "Q1",
        status: "shipped",
        title: "Autonomous Thesis Loop kernel",
        body: "Cryptographic commit/reveal, evidence grading rubric, three-persona red team — all running locally.",
        bullets: [
          "sha-256 commit on every mission",
          "Evidence grades A/B/C/D/X with explicit rubric",
          "Skeptic / Scientist / Senior Reviewer veto rules",
        ],
      },
      {
        q: "Q1",
        status: "shipped",
        title: "12 agent pools online",
        body: "Literature, sequence/structure, target/pathway, variants, ADMET, novelty, patent, grader, thesis, red team, synthesizer, dossier.",
        bullets: [
          "Real PubMed / UniProt / OpenTargets / ChEMBL / AlphaFold calls",
          "Pool-level tier classification (upstream / reasoning / output)",
          "Per-task budget tracking",
        ],
      },
      {
        q: "Q1",
        status: "shipped",
        title: "Mission Control v1",
        body: "Editorial dashboard with live SSE updates and replayable mission cards.",
        bullets: ["12 dashboard panels", "SSE event stream", "Buyer-safe dossier preview"],
      },
    ],
  },
  {
    id: "p1",
    head: "Phase 1 — Wet-lab loop",
    sub: "Make Pepclaw a real research partner, not just a writer.",
    rows: [
      {
        q: "Q2",
        status: "in_progress",
        title: "Synthesis quote integration",
        body: "Live peptide synthesis pricing across vendors, attached to dossier as commitable cost prediction.",
        bullets: ["3+ vendor quotes per dossier", "Commit synthesis cost in mission hash", "Auto-flag when scope drifts"],
      },
      {
        q: "Q2",
        status: "next",
        title: "Assay protocol generator",
        body: "Auto-draft SPR/BLI binding and serum-stability protocols, version-controlled, hashed.",
        bullets: ["Protocol DSL (yaml-like)", "Per-assay prediction commits", "Replay against assay readout"],
      },
      {
        q: "Q3",
        status: "next",
        title: "Real-world assay reveal",
        body: "Submit measured readouts; Pepclaw auto-grades the prediction vs. result and updates trust score.",
        bullets: ["Per-mission Brier score", "Public verifiability", "Falsified predictions are first-class artifacts"],
      },
    ],
  },
  {
    id: "p2",
    head: "Phase 2 — Network",
    sub: "Open the loop to outside auditors and partners.",
    rows: [
      {
        q: "Q3",
        status: "future",
        title: "Public verification CLI",
        body: "pepclaw verify <mission-id> — recompute the commit hash from any machine.",
        bullets: ["Standalone Go binary", "Reads only public commit + salt", "Reproduces evidence index"],
      },
      {
        q: "Q4",
        status: "future",
        title: "External agent pools",
        body: "Third parties can register agent pools that Pepclaw routes to (paid per task, evaluated by trust score).",
        bullets: ["Pool registration manifest", "Per-pool reputation history", "Slashing for fabricated PMIDs"],
      },
      {
        q: "Q4",
        status: "future",
        title: "Buyer marketplace",
        body: "Pharma buyers subscribe to dossier streams matching their target classes.",
        bullets: ["Per-target subscription", "Auditable replay packs", "On-chain settlement (optional)"],
      },
    ],
  },
];

export default function RoadmapPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black text-ink-100">
      <SiteNav active="roadmap" />
      <section className="relative isolate border-b border-plum-500/10 pt-32">
        <div className="absolute -top-20 right-0 -z-10 h-[480px] w-[480px] rounded-full bg-plum-700/[0.10] blur-3xl" />
        <div className="container py-20">
          <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-plum-300">
            <span className="h-px w-8 bg-plum-500/40" />
            Roadmap · 2026 → 2027
          </span>
          <h1 className="mt-6 max-w-4xl font-serif text-[clamp(48px,9vw,112px)] leading-[1.02] tracking-tight text-white">
            Loop, then <em className="text-gradient-plum">network.</em>
          </h1>
          <p className="mt-6 max-w-2xl text-ink-200 leading-relaxed">
            Pepclaw ships in phases. Phase 0 is the kernel. Phase 1 closes the
            wet-lab loop. Phase 2 opens the network so outside auditors and
            buyers join.
          </p>
        </div>
      </section>
      <section className="container py-16 space-y-20">
        {PHASES.map((ph) => (
          <div key={ph.id}>
            <div className="flex items-end justify-between gap-4 border-b border-plum-500/10 pb-5">
              <div>
                <h2 className="font-serif text-[36px] leading-tight text-white">{ph.head}</h2>
                <p className="mt-2 text-ink-200">{ph.sub}</p>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-plum-300/80">
                {ph.id}
              </span>
            </div>
            <ol className="mt-10 space-y-2">
              {ph.rows.map((r, i) => (
                <li key={i} className="grid grid-cols-[auto,1fr] gap-7">
                  <div className="flex flex-col items-center pt-1">
                    <StatusBadge status={r.status} />
                    {i < ph.rows.length - 1 ? (
                      <div className="mt-3 h-full w-px bg-gradient-to-b from-plum-500/30 to-transparent" />
                    ) : null}
                  </div>
                  <div className="pb-8">
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-plum-300/80">
                        {r.q}
                      </span>
                      <h3 className="font-serif text-[26px] text-white leading-tight">
                        {r.title}
                      </h3>
                    </div>
                    <p className="mt-3 max-w-2xl leading-relaxed text-ink-200">{r.body}</p>
                    <ul className="mt-4 grid gap-1.5 max-w-2xl text-[14px] text-ink-200">
                      {r.bullets.map((b, j) => (
                        <li key={j} className="flex items-baseline gap-3">
                          <span className="text-plum-300">·</span> {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </section>
      <SiteFooter />
    </main>
  );
}

function StatusBadge({ status }: { status: Milestone["status"] }) {
  const map: Record<Milestone["status"], { label: string; klass: string }> = {
    shipped: {
      label: "shipped",
      klass: "border-plum-300/45 text-plum-100 bg-plum-500/[0.10] shadow-[0_0_14px_-4px_rgba(124,58,237,0.6)]",
    },
    in_progress: {
      label: "in progress",
      klass: "border-plum-400/50 text-plum-200 bg-plum-600/[0.10]",
    },
    next: {
      label: "next",
      klass: "border-fuchsia-300/40 text-fuchsia-200 bg-fuchsia-600/[0.05]",
    },
    future: {
      label: "future",
      klass: "border-plum-500/15 text-ink-300 bg-white/[0.02]",
    },
  };
  const m = map[status];
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full border px-3 font-mono text-[10px] uppercase tracking-[0.22em]",
        m.klass
      )}
    >
      {m.label}
    </span>
  );
}
