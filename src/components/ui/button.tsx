import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, BtnProps>(function Button(
  { className, variant = "outline", size = "md", ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      {...rest}
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 rounded-full font-mono uppercase tracking-[0.18em] transition-all duration-300 select-none",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-plum-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        size === "sm" && "px-3.5 py-1.5 text-[10px]",
        size === "md" && "px-5 py-2.5 text-[11px]",
        size === "lg" && "px-7 py-3.5 text-[11.5px]",
        variant === "primary" &&
          "bg-plum-600 text-white hover:bg-plum-500 shadow-[0_0_28px_-6px_rgba(124,58,237,0.55)] hover:shadow-[0_0_36px_-4px_rgba(124,58,237,0.7)]",
        variant === "outline" &&
          "border border-plum-500/25 bg-white/[0.02] text-white hover:border-plum-400/50 hover:bg-white/[0.04]",
        variant === "ghost" && "text-ink-200 hover:text-white",
        className
      )}
    />
  );
});
