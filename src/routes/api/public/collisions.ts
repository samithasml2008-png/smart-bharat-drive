import { createFileRoute } from "@tanstack/react-router";
import { eventsAt } from "@/lib/collision-feed";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/public/collisions")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 20));
        const city = url.searchParams.get("city")?.slice(0, 40);
        let events = eventsAt(Date.now(), 50);
        if (city) events = events.filter((e) => e.city.toLowerCase() === city.toLowerCase());
        return Response.json(
          { generatedAt: new Date().toISOString(), count: Math.min(limit, events.length), events: events.slice(0, limit) },
          { headers: { ...CORS, "Cache-Control": "no-store" } },
        );
      },
    },
  },
});
