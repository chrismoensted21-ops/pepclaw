import Link from "next/link";
import { PepclawMark, XMark } from "./nav";

export function SiteFooter() {
  return (
    <footer className="border-t border-plum-500/10 mt-16 bg-black">
      <div className="container py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr,1fr,1fr,1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <PepclawMark className="h-5 w-5 text-plum-300" />
              <span className="font-serif text-[20px] tracking-tight text-white">Pepclaw</span>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-200">
              An autonomous research swarm for nonclinical peptide discovery.
              Tamper-evident, replayable, economically accountable.
            </p>
            <div className="mt-7 flex items-center gap-3">
              <a
                href="https://x.com/pepclawresearch"
                target="_blank"
                rel="noreferrer"
                aria-label="Pepclaw on X"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-plum-500/20 bg-white/[0.02] text-ink-100 transition-all hover:border-plum-400/45 hover:bg-white/[0.04] hover:text-white"
              >
                <XMark className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://x.com/pepclawresearch"
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-200 hover:text-plum-200"
              >
                @pepclawresearch
              </a>
            </div>
            <p className="mt-7 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-300">
              © {new Date().getFullYear()} Pepclaw — research only · no human-use claim
            </p>
          </div>
          <Col
            title="Product"
            links={[
              { href: "/app", label: "Mission Control" },
              { href: "/docs", label: "Docs" },
              { href: "/roadmap", label: "Roadmap" },
            ]}
          />
          <Col
            title="Protocol"
            links={[
              { href: "/docs#commit-reveal", label: "Commit / Reveal" },
              { href: "/docs#evidence-grading", label: "Evidence Grading" },
              { href: "/docs#agents", label: "Agent Pools" },
            ]}
          />
          <Col
            title="Research"
            links={[
              { href: "/docs#sources", label: "Data Sources" },
              { href: "/docs#api", label: "API" },
              { href: "/docs#dossiers", label: "Dossiers" },
            ]}
          />
        </div>
      </div>
    </footer>
  );
}

function Col({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h4 className="font-mono text-[10px] uppercase tracking-[0.22em] text-plum-300/80">
        {title}
      </h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-[14px] text-ink-100 hover:text-plum-200">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
