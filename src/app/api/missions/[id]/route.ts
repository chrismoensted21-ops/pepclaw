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
  const mission = await getMission(id);
  if (!mission) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const [tasks, findings, theses, critiques, dossiers] = await Promise.all([
    listMissionTasks(id),
    listFindings(id),
    listTheses(id),
    listCritiques(id),
    listDossiers(id),
  ]);
  return NextResponse.json({ mission, tasks, findings, theses, critiques, dossiers });
}
