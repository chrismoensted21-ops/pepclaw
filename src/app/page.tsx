import Image from "next/image";
import Link from "next/link";
import { SiteNav, PepclawMark } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { ALL_POOLS, POOL_LABEL, POOL_DESC, POOL_TIER } from "@/lib/types";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black text-ink-50">
      <SiteNav active="home" />
      <Hero />
      <Marquee />
      <Loop />
      <Pools />
      <Sources />
      <Why />
      <CTA />
      <SiteFooter />
    </main>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/hero-peptide.png"
          alt=""
          fill
          priority
          className="object-cover opacity-70 mask-fade-b"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/40 to-black" />
        <div className="absolute inset-0 grid-bg opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      </div>

      <div className="container relative pt-44 pb-32 lg:pt-52 lg:pb-44">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-plum-500/25 bg-plum-600/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-plum-200">
            <span className="h-1.5 w-1.5 rounded-full bg-plum-300 shadow-[0_0_10px_currentColor] animate-pulse-soft" />
            PRX-001 · Autonomous Thesis Loop · Live
          </span>
        </Reveal>
        <Reveal delay={120}>
          <h1 className="mt-8 max-w-5xl font-serif text-[clamp(48px,10vw,128px)] leading-[0.95] tracking-tight text-white">
            Peptide research,
            <br />
            <span className="text-gradient-plum italic">replayable by anyone.</span>
          </h1>
        </Reveal>
        <Reveal delay={220}>
          <p className="mt-10 max-w-2xl text-[17px] leading-relaxed text-ink-200">
            Pepclaw is an autonomous research swarm for nonclinical peptide
            discovery. Twelve specialist agent pools query the world's biomedical
            databases, grade their own evidence, and ship a buyer-safe dossier —
            every claim hashed before the run, revealed after, and verifiable
            forever.
          </p>
        </Reveal>
        <Reveal delay={300}>
          <div className="mt-12 flex flex-wrap items-center gap-3">
            <Link href="/app">
              <Button variant="primary" size="lg">
                Open Mission Control
              </Button>
            </Link>
            <Link href="/docs">
              <Button variant="ghost" size="lg">
                Read the protocol →
              </Button>
            </Link>
          </div>
        </Reveal>

        <Reveal delay={420}>
          <dl className="mt-24 grid grid-cols-2 gap-x-10 gap-y-6 max-w-4xl md:grid-cols-4">
            {[
              ["12", "Agent pools"],
              ["10", "DAG stages"],
              ["A → X", "Evidence grades"],
              ["sha-256", "Commit / reveal"],
            ].map(([v, l]) => (
              <div key={l} className="border-l border-plum-500/20 pl-5">
                <div className="font-serif text-4xl text-gradient-plum-soft">{v}</div>
                <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-300">
                  {l}
                </div>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}

function Marquee() {
  const items = [
    "PubMed",
    "UniProt",
    "AlphaFold",
    "OpenTargets",
    "ChEMBL",
    "Reactome",
    "Lens.org",
    "ClinicalTrials.gov",
    "PDB",
  ];
  const row = [...items, ...items];
  return (
    <section className="relative border-y border-plum-500/10 bg-black/60 py-8 overflow-hidden mask-fade-r">
      <div className="container mb-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-300">
          Powered by real biomedical evidence — no mocks, no fabricated PMIDs
        </div>
      </div>
      <div className="relative flex overflow-hidden">
        <div className="flex animate-[marquee_36s_linear_infinite] gap-14 whitespace-nowrap pr-14">
          {row.map((s, i) => (
            <span
              key={i}
              className="font-serif text-3xl text-ink-200 hover:text-plum-200"
            >
              {s}
              <span className="ml-14 text-plum-700/40">·</span>
            </span>
          ))}
        </div>
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </section>
  );
}

function Loop() {
  const steps = [
    {
      n: "01",
      head: "Commit",
      body:
        "Each mission's question and target are hashed with a per-mission salt before any agent runs. Pepclaw cannot change the question post-hoc.",
    },
    {
      n: "02",
      head: "Ingest",
      body:
        "Upstream pools pull live evidence from PubMed, UniProt, AlphaFold, OpenTargets, ChEMBL and Reactome. Every finding carries source provenance.",
    },
    {
      n: "03",
      head: "Reason",
      body:
        "Reasoning pools score novelty, grade evidence A through X, and compose falsifiable theses with explicit mechanism claims.",
    },
    {
      n: "04",
      head: "Critique",
      body:
        "A three-persona red team — Skeptic, Scientist, Senior Reviewer — challenges every thesis. Only the Senior may issue a hard block.",
    },
    {
      n: "05",
      head: "Reveal",
      body:
        "On completion, Pepclaw publishes the salt. Anyone can re-hash the original question and verify the run was honest end-to-end.",
    },
  ];
  return (
    <section className="relative isolate">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/section-loop.png"
          alt=""
          fill
          className="object-cover opacity-30 mask-fade-b"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black" />
      </div>
      <div className="container py-32 lg:py-40">
        <Reveal>
          <Eyebrow>The Loop · five stages</Eyebrow>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="mt-4 max-w-3xl font-serif text-[clamp(40px,6vw,72px)] leading-tight tracking-tight text-white">
            Tamper-evident <em className="text-gradient-plum">by design.</em>
          </h2>
        </Reveal>
        <Reveal delay={160}>
          <p className="mt-6 max-w-2xl text-ink-200 leading-relaxed">
            Pepclaw doesn&rsquo;t try to make biology trustless. It makes the
            claims, predictions, artifacts and state transitions tamper-evident,
            replayable and economically accountable.
          </p>
        </Reveal>
        <ol className="mt-16 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {steps.map((s, i) => (
            <Reveal as="li" key={s.n} delay={i * 110}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-plum-500/12 bg-white/[0.015] p-6 transition-all duration-500 hover:border-plum-500/30 hover:bg-white/[0.03]">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-plum-300">
                  Step {s.n}
                </div>
                <div className="mt-4 font-serif text-3xl text-white">{s.head}</div>
                <p className="mt-3 text-[13.5px] leading-relaxed text-ink-200">{s.body}</p>
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-plum-700/10 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Pools() {
  const grouped = ALL_POOLS.reduce<Record<string, typeof ALL_POOLS>>((acc, p) => {
    const k = POOL_TIER[p];
    (acc[k] ??= [] as typeof ALL_POOLS).push(p);
    return acc;
  }, {});
  const tiers: { key: keyof typeof grouped; label: string; sub: string }[] = [
    {
      key: "upstream",
      label: "Upstream — data ingestion",
      sub: "Real biomedical APIs · provenance preserved",
    },
    {
      key: "reasoning",
      label: "Reasoning — pattern & critique",
      sub: "Whitespace, grading, hypothesis, red team",
    },
    {
      key: "output",
      label: "Output — synthesis & dossier",
      sub: "Buyer-safe markdown · PMID-cited · hedged",
    },
  ];

  return (
    <section className="relative isolate">
      <div className="absolute right-0 top-1/4 -z-10 h-[420px] w-[420px] rounded-full bg-plum-700/[0.08] blur-3xl" />
      <div className="container py-32 lg:py-40">
        <Reveal>
          <Eyebrow>The swarm · twelve pools</Eyebrow>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="mt-4 max-w-3xl font-serif text-[clamp(40px,6vw,72px)] leading-tight tracking-tight text-white">
            One orchestrator. <em className="text-gradient-plum">Twelve specialists.</em>
          </h2>
        </Reveal>

        <div className="mt-20 space-y-16">
          {tiers.map((tier, ti) => (
            <Reveal key={tier.key} delay={ti * 80}>
              <div>
                <div className="flex items-end justify-between gap-4 border-b border-plum-500/12 pb-4">
                  <h3 className="font-serif text-[28px] text-white">{tier.label}</h3>
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-300">
                    {tier.sub}
                  </span>
                </div>
                <ul className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {grouped[tier.key].map((p, i) => (
                    <Reveal as="li" key={p} delay={i * 60}>
                      <div className="group h-full rounded-xl border border-plum-500/10 bg-white/[0.015] p-5 transition-all duration-500 hover:border-plum-500/30 hover:bg-white/[0.03]">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="font-serif text-[22px] text-white">
                            {POOL_LABEL[p]}
                          </span>
                          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-plum-300/80">
                            {p}
                          </span>
                        </div>
                        <p className="mt-3 text-[13px] leading-relaxed text-ink-200">
                          {POOL_DESC[p]}
                        </p>
                      </div>
                    </Reveal>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Sources() {
  return (
    <section className="relative isolate border-y border-plum-500/10">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/section-helix.png"
          alt=""
          fill
          className="object-cover opacity-50 mask-fade-b"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/70 to-black" />
      </div>
      <div className="container py-32 lg:py-40 grid gap-16 md:grid-cols-[1fr,1.1fr]">
        <div>
          <Reveal>
            <Eyebrow>Real evidence · real APIs</Eyebrow>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-4 font-serif text-[clamp(36px,5vw,60px)] leading-tight tracking-tight text-white">
              No mocks.
              <br />
              <em className="text-gradient-plum">No fabricated PMIDs.</em>
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 text-ink-200 leading-relaxed">
              Every finding Pepclaw produces is anchored in a real source
              identifier you can click. Every PubMed citation has a real PMID.
              Every UniProt entry resolves. Every OpenTargets association is
              recomputable. If a finding cannot be traced to its source, it
              cannot enter the dossier.
            </p>
          </Reveal>
        </div>
        <Reveal delay={120}>
          <ul className="grid grid-cols-2 gap-2.5 self-start">
            {[
              { l: "PubMed", s: "live" },
              { l: "UniProt", s: "live" },
              { l: "AlphaFold", s: "live" },
              { l: "OpenTargets", s: "live" },
              { l: "ChEMBL", s: "live" },
              { l: "Reactome", s: "live" },
              { l: "Lens.org Patents", s: "pending" },
              { l: "ClinicalTrials.gov", s: "future" },
            ].map((s) => (
              <li
                key={s.l}
                className="flex items-center justify-between gap-3 rounded-xl border border-plum-500/12 bg-white/[0.02] px-4 py-3.5"
              >
                <span className="text-[15px] text-white">{s.l}</span>
                <span
                  className={
                    "font-mono text-[9px] uppercase tracking-[0.22em] " +
                    (s.s === "live"
                      ? "text-plum-200"
                      : s.s === "pending"
                        ? "text-fuchsia-300/80"
                        : "text-ink-300")
                  }
                >
                  {s.s}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

function Why() {
  const points = [
    {
      h: "Falsifiability is a first-class artifact.",
      b: "Every mission commits a sha-256 hash before it runs and reveals the salt after. Auditors can replay the loop forever.",
    },
    {
      h: "Evidence is graded, not gestured at.",
      b: "Findings are scored A through X using study type, replication and reporting strength — and the rubric ships in /docs.",
    },
    {
      h: "The red team can actually block.",
      b: "Three personas critique each thesis. Only the Senior Reviewer holds veto, and only when mechanism is unfalsifiable or evidence is fabricated.",
    },
    {
      h: "A clean falsification is a successful run.",
      b: "The only unacceptable outcome is an uninterpretable result. Negative answers ship as dossiers too.",
    },
  ];
  return (
    <section className="relative isolate">
      <div className="container py-32 lg:py-40">
        <Reveal>
          <Eyebrow>Why this is different</Eyebrow>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="mt-4 max-w-3xl font-serif text-[clamp(40px,6vw,72px)] leading-tight tracking-tight text-white">
            Built so you don&rsquo;t have to <em className="text-gradient-plum">trust us.</em>
          </h2>
        </Reveal>
        <div className="mt-16 grid gap-12 md:grid-cols-2">
          {points.map((p, i) => (
            <Reveal key={p.h} delay={i * 100}>
              <div className="border-l border-plum-500/20 pl-7">
                <h3 className="font-serif text-[28px] text-white leading-tight">{p.h}</h3>
                <p className="mt-3 leading-relaxed text-ink-200">{p.b}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-plum-700/[0.18] blur-3xl" />
      </div>
      <div className="container py-36 text-center">
        <Reveal>
          <PepclawMark className="mx-auto h-12 w-12 text-plum-300" />
        </Reveal>
        <Reveal delay={80}>
          <h2 className="mx-auto mt-8 max-w-3xl font-serif text-[clamp(36px,6vw,72px)] leading-tight tracking-tight text-white">
            Watch the swarm <em className="text-gradient-plum">work in real time.</em>
          </h2>
        </Reveal>
        <Reveal delay={160}>
          <p className="mx-auto mt-8 max-w-xl text-ink-200">
            Mission Control is the live operations cockpit. Start a mission,
            watch twelve pools negotiate evidence, then read the buyer-safe
            dossier.
          </p>
        </Reveal>
        <Reveal delay={240}>
          <div className="mt-12 flex justify-center gap-3">
            <Link href="/app">
              <Button variant="primary" size="lg">
                Open Mission Control
              </Button>
            </Link>
            <Link href="/roadmap">
              <Button variant="outline" size="lg">
                See roadmap
              </Button>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-plum-300">
      <span className="h-px w-8 bg-plum-500/40" />
      {children}
    </span>
  );
}
