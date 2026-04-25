"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface NavProps {
  active?: "home" | "app" | "roadmap" | "docs";
}

const ITEMS = [
  { id: "home" as const, href: "/", label: "Overview" },
  { id: "app" as const, href: "/app", label: "Mission Control" },
  { id: "roadmap" as const, href: "/roadmap", label: "Roadmap" },
  { id: "docs" as const, href: "/docs", label: "Docs" },
];

export function SiteNav({ active }: NavProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  const computedActive: NavProps["active"] =
    active ??
    (pathname?.startsWith("/app")
      ? "app"
      : pathname?.startsWith("/roadmap")
        ? "roadmap"
        : pathname?.startsWith("/docs")
          ? "docs"
          : "home");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        "fixed left-1/2 z-40 -translate-x-1/2 transition-all duration-500",
        "w-[min(calc(100vw-1.5rem),760px)] flex justify-center",
        scrolled ? "top-2" : "top-4"
      )}
    >
      <nav
        className={cn(
          "flex w-full items-center gap-1 rounded-full glass px-1.5 py-1.5 transition-all duration-500 sm:gap-1.5 sm:px-2 sm:py-2",
          scrolled
            ? "shadow-[0_20px_60px_-30px_rgba(124,58,237,0.45)] scale-[0.985]"
            : "shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)]"
        )}
      >
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 pl-2 pr-2.5 py-1 rounded-full hover:bg-white/[0.03] sm:pl-2.5 sm:pr-3"
        >
          <PepclawMark className="h-5 w-5 text-plum-300" />
          <span className="font-serif text-[17px] tracking-tight text-white sm:text-[18px]">
            Pepclaw
          </span>
        </Link>
        <div className="mx-1 hidden h-5 w-px bg-white/[0.08] md:block" />
        <div className="hidden min-w-0 items-center md:flex">
          {ITEMS.map((it) => (
            <Link
              key={it.id}
              href={it.href}
              className={cn(
                "relative shrink-0 rounded-full px-2.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] transition-colors lg:px-3.5 lg:tracking-[0.18em]",
                computedActive === it.id
                  ? "text-white"
                  : "text-ink-200 hover:text-white"
              )}
            >
              {it.label}
              {computedActive === it.id ? (
                <span className="absolute inset-0 -z-10 rounded-full bg-plum-600/15 ring-1 ring-plum-500/30" />
              ) : null}
            </Link>
          ))}
        </div>
        <Link
          href="/app"
          className={cn(
            "ml-auto shrink-0 rounded-full bg-plum-600/15 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-plum-100 ring-1 ring-plum-500/30 transition-colors hover:bg-plum-600/25 md:hidden"
          )}
        >
          Open app
        </Link>
        <div className="mx-1 hidden h-5 w-px bg-white/[0.08] md:ml-auto md:block" />
        <a
          href="https://x.com/pepclawresearch"
          target="_blank"
          rel="noreferrer"
          aria-label="Pepclaw on X"
          className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-200 transition-colors hover:bg-white/[0.04] hover:text-white md:ml-0"
        >
          <XMark className="h-3.5 w-3.5" />
        </a>
      </nav>
    </div>
  );
}

export function XMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
    </svg>
  );
}

export function PepclawMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="pl-mark-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ddd6fe" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <g
        stroke="url(#pl-mark-g)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="rotate(-32 32 32)"
      >
        <line x1="11" y1="32" x2="17" y2="32" />
        <line x1="17" y1="27" x2="17" y2="37" />
        <rect x="17" y="26" width="24" height="12" rx="0.8" />
        <line x1="22" y1="26" x2="22" y2="22" />
        <line x1="22" y1="38" x2="22" y2="42" />
        <line x1="41" y1="32" x2="50" y2="32" />
        <circle cx="52" cy="32" r="1" fill="#ddd6fe" stroke="none" />
        <circle cx="23" cy="32" r="1.2" fill="#a78bfa" stroke="none" opacity="0.8" />
        <circle cx="29" cy="32" r="1.2" fill="#a78bfa" stroke="none" opacity="0.65" />
        <circle cx="35" cy="32" r="1.2" fill="#a78bfa" stroke="none" opacity="0.5" />
      </g>
    </svg>
  );
}
