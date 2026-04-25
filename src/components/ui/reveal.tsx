"use client";

import {
  createElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type RevealTag = "div" | "section" | "li" | "article";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: RevealTag;
}

export function Reveal({ children, delay = 0, className, as = "div" }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (!ref.current || seen) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setSeen(true);
            obs.disconnect();
            return;
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [seen]);

  const style: CSSProperties = { transitionDelay: `${delay}ms` };
  return createElement(
    as,
    {
      ref,
      style,
      className: cn("reveal-up", seen && "in", className),
    },
    children
  );
}
