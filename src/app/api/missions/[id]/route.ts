import { NextRequest, NextResponse } from "next/server";
import {
  getMission,
  listMissionTasks,
  listFindings,
  listTheses,
  listCritiques,
  listDossiers,
} from "@/lib/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mission = getMission(id);
  if (!mission) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({
    mission,
    tasks: listMissionTasks(id),
    findings: listFindings(id),
    theses: listTheses(id),
    critiques: listCritiques(id),
    dossiers: listDossiers(id),
  });
}
