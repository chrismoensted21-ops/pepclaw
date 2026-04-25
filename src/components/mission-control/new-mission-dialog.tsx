"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  onStarted: () => void;
}

export function NewMissionDialog({ onStarted }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState("");
  const [depth, setDepth] = useState<"scout" | "standard" | "deep">("standard");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (query.trim().length < 4) {
      setErr("Query must be at least 4 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          target_class: target.trim() || null,
          depth,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error?.formErrors?.[0] ?? "Could not start mission");
      }
      setOpen(false);
      setQuery("");
      setTarget("");
      onStarted();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button variant="primary" size="md" onClick={() => setOpen(true)}>
        + New mission
      </Button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => !submitting && setOpen(false)}
        >
          <form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            className="panel w-full max-w-xl space-y-5 p-6"
          >
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-plum-200/80">
                Start a mission
              </div>
              <h3 className="mt-2 font-serif text-2xl text-ink-50">Commit and run</h3>
              <p className="mt-1 text-sm text-ink-300">
                Pepclaw hashes your question with a per-mission salt before any agent runs.
                The salt is revealed when the mission completes.
              </p>
            </div>

            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink-300">
                Research question
              </span>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={3}
                placeholder="e.g. Engineered GLP-1 analogs with extended half-life and reduced GI side effects"
                className="mt-2 block w-full resize-y rounded-sm border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-ink-50 placeholder:text-ink-400 focus:border-plum-300/50 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink-300">
                Target class (optional)
              </span>
              <input
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="e.g. GLP-1R, GIPR, MC4R"
                className="mt-2 block w-full rounded-sm border border-white/10 bg-black/40 px-3 py-2 text-sm text-ink-50 placeholder:text-ink-400 focus:border-plum-300/50 focus:outline-none"
              />
            </label>

            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink-300">Depth</span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(["scout", "standard", "deep"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDepth(d)}
                    className={
                      "rounded-sm border px-3 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors " +
                      (depth === d
                        ? "border-plum-300/60 bg-plum-300/10 text-plum-100"
                        : "border-white/10 bg-white/2 text-ink-200 hover:border-white/20")
                    }
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {err ? (
              <div className="rounded-sm border border-red-400/30 bg-red-400/[0.05] px-3 py-2 font-mono text-[11px] text-red-200">
                {err}
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" type="button" onClick={() => setOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? "Committing…" : "Commit + run"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
