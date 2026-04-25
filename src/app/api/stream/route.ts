import { NextRequest } from "next/server";
import { eventsSince, lastEventId } from "@/lib/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-Sent Events stream of swarm events.
 * Pulls fresh events every ~700ms while the connection stays open.
 * Pass ?mission_id=... to filter events for a specific mission.
 */
export async function GET(req: NextRequest) {
  const missionId = req.nextUrl.searchParams.get("mission_id");
  let cursor = await lastEventId();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      send({ type: "hello", cursor });

      const tick = async () => {
        try {
          const evs = await eventsSince(cursor, missionId, 200);
          if (evs.length > 0) {
            cursor = evs[evs.length - 1].id;
            for (const e of evs) {
              send({
                type: "event",
                id: e.id,
                kind: e.kind,
                pool: e.pool,
                mission_id: e.mission_id,
                payload: e.payload ?? null,
                created_at: e.created_at,
              });
            }
          } else {
            // heartbeat keeps connection warm through proxies
            send({ type: "ping", t: Date.now() });
          }
        } catch (err) {
          send({ type: "error", error: (err as Error).message });
        }
      };

      const interval = setInterval(tick, 700);
      const close = () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
      req.signal.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
