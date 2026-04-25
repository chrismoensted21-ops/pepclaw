import { NextRequest, NextResponse } from "next/server";
import { buildDashboard } from "@/lib/dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const focus = req.nextUrl.searchParams.get("mission_id");
  return NextResponse.json(buildDashboard(focus));
}
