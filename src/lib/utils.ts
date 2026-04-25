import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds?: number | null): string {
  if (!seconds || !Number.isFinite(seconds)) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export function formatRelativeUtc(iso?: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const day = date.toISOString().slice(0, 10);
  const pad = (n: number) => String(n).padStart(2, "0");
  const time = `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`;
  if (today === day) return `Today ${time}`;
  const y = new Date(now);
  y.setUTCDate(now.getUTCDate() - 1);
  if (day === y.toISOString().slice(0, 10)) return `Yesterday ${time}`;
  return `${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${time}`;
}

export function nowUtcLabel(): string {
  const t = new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${months[t.getUTCMonth()]} ${t.getUTCDate()}, ${t.getUTCFullYear()} · ${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())} UTC`;
}

export function shortId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 12);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
