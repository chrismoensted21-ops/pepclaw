import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PanelProps {
  title?: ReactNode;
  topRight?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
  footnote?: ReactNode;
}

export function Panel({ title, topRight, className, bodyClassName, children, footnote }: PanelProps) {
  return (
    <section className={cn("panel", className)}>
      {(title || topRight) && (
        <header className="flex items-center justify-between gap-3 border-b border-plum-500/10 px-5 py-3.5">
          {title ? (
            <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-plum-200/80">
              {title}
            </h3>
          ) : (
            <span />
          )}
          {topRight}
        </header>
      )}
      <div className={cn("px-5 py-5", bodyClassName)}>{children}</div>
      {footnote ? (
        <footer className="border-t border-plum-500/10 px-5 py-2.5 font-mono text-[10px] tracking-[0.22em] text-ink-300">
          {footnote}
        </footer>
      ) : null}
    </section>
  );
}
