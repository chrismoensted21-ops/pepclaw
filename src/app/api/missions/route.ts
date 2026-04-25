import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listMissions } from "@/lib/repo";
import { startMission } from "@/lib/orchestrator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const StartSchema = z.object({
  query: z.string().min(3).max(2000),
  target_class: z.string().max(120).optional().nullable(),
  depth: z.enum(["scout", "standard", "deep"]).optional(),
  budget_cents: z.number().int().min(0).max(50000).optional(),
});

export async function GET() {
  return NextResponse.json({ missions: listMissions(50) });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = StartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const id = await startMission(parsed.data);
  return NextResponse.json({ mission_id: id }, { status: 202 });
}
