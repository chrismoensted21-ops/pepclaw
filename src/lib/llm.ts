/**
 * kie.ai LLM wrapper for Pepclaw reasoning agents.
 * Uses the GPT-5-4 responses endpoint at POST {KIE_BASE_URL}/codex/v1/responses
 *
 * If no KIE_API_KEY is set, falls back to deterministic templated output so the
 * swarm can run end-to-end without keys (useful for first-run / demo).
 */

interface ChatMessage {
  role: "system" | "user" | "assistant" | "developer" | "tool";
  content: string;
}

interface ChatOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  /** Reasoning effort. Higher = more thorough. */
  effort?: "low" | "medium" | "high" | "xhigh";
}

export interface LlmResult {
  text: string;
  model: string;
  usedFallback: boolean;
  promptTokens?: number;
  completionTokens?: number;
  creditsConsumed?: number;
}

interface KieResponse {
  output?: KieOutputItem[];
  usage?: { total_tokens?: number; input_tokens?: number; output_tokens?: number };
  credits_consumed?: number;
  status?: string;
}

interface KieOutputItem {
  type: "reasoning" | "message" | string;
  role?: string;
  status?: string;
  content?: { type: string; text?: string }[];
}

export function isLlmConfigured(): boolean {
  return !!(process.env.KIE_API_KEY && process.env.KIE_API_KEY.trim().length > 0);
}

export async function chat(opts: ChatOptions): Promise<LlmResult> {
  const apiKey = process.env.KIE_API_KEY;
  const baseUrl = (process.env.KIE_BASE_URL || "https://api.kie.ai").replace(/\/+$/, "");
  const model = process.env.KIE_MODEL || "gpt-5-4";
  const defaultEffort =
    (process.env.KIE_REASONING_EFFORT as ChatOptions["effort"]) ?? "medium";

  if (!apiKey) {
    return {
      text: deterministicFallback(opts.messages, opts.jsonMode),
      model: "fallback:deterministic",
      usedFallback: true,
    };
  }

  // The kie.ai responses endpoint accepts message arrays where each `content`
  // item is a typed object. We map our system/user roles to that shape.
  const input = opts.messages.map((m) => ({
    role: m.role === "system" ? "system" : m.role === "assistant" ? "assistant" : "user",
    content: [{ type: "input_text", text: m.content }],
  }));

  const body = {
    model,
    stream: false,
    input,
    reasoning: { effort: opts.effort ?? defaultEffort },
  };

  const url = `${baseUrl}/codex/v1/responses`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
        accept: "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (e) {
    return {
      text: deterministicFallback(opts.messages, opts.jsonMode),
      model: `fallback:network-error (${(e as Error).message})`,
      usedFallback: true,
    };
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    // Soft-fall back rather than throw, so a single API hiccup doesn't kill a mission.
    return {
      text: deterministicFallback(opts.messages, opts.jsonMode),
      model: `fallback:kie-${res.status}`,
      usedFallback: true,
    };
  }

  const json = (await res.json()) as KieResponse;
  const text = extractText(json);

  return {
    text,
    model,
    usedFallback: false,
    promptTokens: json.usage?.input_tokens,
    completionTokens: json.usage?.output_tokens,
    creditsConsumed: json.credits_consumed,
  };
}

function extractText(resp: KieResponse): string {
  const items = resp.output ?? [];
  for (const item of items) {
    if (item.type === "message" && item.content) {
      const t = item.content
        .filter((c) => c.type === "output_text" || c.type === "text")
        .map((c) => c.text ?? "")
        .join("\n")
        .trim();
      if (t) return t;
    }
  }
  // Some providers return text directly under output[].text or via different shapes; try last resort.
  for (const item of items) {
    const anyContent = (item.content ?? []) as { text?: string }[];
    const t = anyContent.map((c) => c.text ?? "").join("\n").trim();
    if (t) return t;
  }
  return "";
}

/**
 * Deterministic fallback used when no kie.ai key is configured.
 */
function deterministicFallback(messages: ChatMessage[], jsonMode?: boolean): string {
  const userMsg = messages.filter((m) => m.role === "user").map((m) => m.content).join("\n");
  const sysMsg = messages.find((m) => m.role === "system")?.content ?? "";
  const lower = (sysMsg + " " + userMsg).toLowerCase();

  if (jsonMode || lower.includes("strict json")) {
    if (lower.includes("critique") || lower.includes("red team")) {
      return JSON.stringify({
        critiques: [
          {
            persona: "skeptic",
            severity: "warning",
            category: "premise",
            specific_concern:
              "Mechanism rests on indirect binding inference; no co-structure is cited and the staple position is asserted, not derived.",
            suggested_fix: "Run an orthogonal SPR/BLI engagement assay before any in-vivo claim.",
          },
          {
            persona: "scientist",
            severity: "warning",
            category: "rigor",
            specific_concern:
              "Lipidation-driven half-life extension trades against tissue penetration; the dossier does not address this trade-off.",
            suggested_fix: "Add a PK/PD model run with explicit albumin-binding term and measure tissue partition.",
          },
          {
            persona: "senior_reviewer",
            severity: "info",
            category: "summary",
            specific_concern: "Acceptable as exploratory thesis; not block-worthy.",
            suggested_fix: "Proceed to synthesis after committing predictions.",
            blocks: false,
          },
        ],
      });
    }
    return JSON.stringify({
      title: extractTitleHint(userMsg),
      hypothesis:
        "An engineered peptide variant of the candidate scaffold — combining i,i+4 hydrocarbon stapling at solvent-exposed residues with C-terminal lipidation — will increase target engagement and proteolytic stability vs. the reference sequence.",
      mechanism:
        "The staple stabilizes the alpha-helical bound conformation; lipidation extends plasma half-life via albumin binding without disrupting the binding face.",
      conviction: 0.62,
      evidence_grade: "B",
      target: extractTargetHint(userMsg),
      evidence_summary:
        "Built from upstream pool consensus across literature, structure and target/pathway evidence.",
    });
  }

  if (lower.includes("synthesis") || lower.includes("synthesi") || lower.includes("dossier")) {
    return synthesizeDossier(userMsg);
  }

  return [
    "Working summary based on retrieved evidence:",
    "- The retrieved corpus supports a structurally tractable peptide scaffold against the requested target class.",
    "- Cross-pool signals (UniProt + ChEMBL + OpenTargets) are concordant on mechanism plausibility.",
    "- Outstanding risks are developability (half-life, off-target) and patent landscape; both addressed in dossier.",
  ].join("\n");
}

function extractTitleHint(text: string): string {
  const m = text.match(/(?:about|for|on|targeting)\s+([A-Za-z0-9\-_/]{3,40})/i);
  if (m) return `Engineered peptide thesis · ${m[1]}`;
  return "Engineered peptide thesis · candidate scaffold";
}

function extractTargetHint(text: string): string {
  const m = text.match(/[A-Z][A-Z0-9]{1,6}\b/);
  return m ? m[0] : "candidate target";
}

function synthesizeDossier(userMsg: string): string {
  return [
    "## Question",
    userMsg.slice(0, 400),
    "",
    "## Cross-pool consensus",
    "- Literature corpus is recent and replicated; mechanism plausibility is supported by multiple A/B-graded sources.",
    "- Sequence/structure pool confirms structural tractability with high pLDDT in the binding region.",
    "- Target/pathway pool maps the candidate to disease associations with non-trivial therapeutic-area coverage.",
    "- ChEMBL ligand prior shows the target has been chemically interrogated; small-molecule baseline available.",
    "",
    "## Open questions",
    "- Optimal stapling position for the engineered variant.",
    "- Tissue partitioning vs. half-life trade-off.",
    "- Patent freedom-to-operate around close analogs.",
    "",
    "## Risks",
    "- Developability: peptide half-life and protease susceptibility need empirical characterization.",
    "- Patent landscape: apparent whitespace, but full FTO requires patent-pool re-run.",
    "- Reproducibility: highest-conviction findings rest on ≥2 independent reports.",
    "",
    "## Recommended next steps",
    "1. Generate 8 sequence variants via lipidation + i,i+4 stapling sweep.",
    "2. Order custom synthesis (~$8k base scenario).",
    "3. Run orthogonal binding (SPR/BLI) and serum-stability before any in-vivo claim.",
    "4. Commit prediction hash before each round; reveal salt only after assay readout.",
  ].join("\n");
}

export function tryParseJson<T>(s: string): T | null {
  if (!s) return null;
  const trimmed = s.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) {
      try {
        return JSON.parse(fence[1]) as T;
      } catch {
        // fall through
      }
    }
    const open = trimmed.indexOf("{");
    const close = trimmed.lastIndexOf("}");
    if (open >= 0 && close > open) {
      try {
        return JSON.parse(trimmed.slice(open, close + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}
