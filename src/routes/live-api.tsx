import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { CollisionEvent } from "@/lib/collision-feed";

export const Route = createFileRoute("/live-api")({
  head: () => ({
    meta: [
      { title: "Live Traffic Collision Detection API" },
      { name: "description", content: "Real-time collision detection feed across Indian cities with risk, time-to-collision and planner actions." },
      { property: "og:title", content: "Live Traffic Collision Detection API" },
      { property: "og:description", content: "Real-time JSON feed of detected collision risks on Indian roads." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LiveApi,
});

const SEV: Record<string, string> = { high: "var(--color-danger)", medium: "var(--color-warn)", low: "var(--color-ok)" };

function LiveApi() {
  const [events, setEvents] = useState<CollisionEvent[]>([]);
  const [city, setCity] = useState("");
  const [latency, setLatency] = useState(0);
  const [live, setLive] = useState(true);

  useEffect(() => {
    if (!live) return;
    let stop = false;
    const load = async () => {
      const t0 = performance.now();
      const res = await fetch(`/api/public/collisions?limit=30${city ? `&city=${encodeURIComponent(city)}` : ""}`);
      const data = await res.json();
      if (!stop) {
        setLatency(performance.now() - t0);
        setEvents(data.events);
      }
    };
    load();
    const id = setInterval(load, 2000);
    return () => { stop = true; clearInterval(id); };
  }, [city, live]);

  const high = events.filter((e) => e.severity === "high").length;
  const avoided = events.filter((e) => e.status === "avoided").length;
  const cities = ["", "Delhi", "Mumbai", "Bengaluru", "Chennai", "Hyderabad", "Kolkata", "Pune", "Jaipur"];

  return (
    <main className="mx-auto max-w-[1500px] px-5 py-5 font-sans text-foreground">
      <h1 className="text-lg font-bold">Real-time Traffic Collision Detection API</h1>
      <p className="font-mono text-xs text-muted-foreground">Perception → prediction → risk → planner action, streamed every 2 s</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        {[["Events in feed", events.length], ["High risk", high], ["Avoided by replanning", avoided], ["API latency", `${latency.toFixed(0)} ms`]].map(([l, v]) => (
          <div key={l} className="rounded-lg border border-border bg-card p-3">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{l}</div>
            <div className="font-mono text-xl font-bold">{v}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-border bg-card p-3 font-mono text-xs">
        <div className="text-muted-foreground">Endpoint</div>
        <code className="text-primary">GET /api/public/collisions?limit=20&amp;city=Delhi</code>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {cities.map((c) => (
          <button key={c || "all"} onClick={() => setCity(c)}
            className={`rounded-md border px-3 py-1.5 font-mono text-xs ${city === c ? "border-primary text-foreground" : "border-border text-muted-foreground"}`}>
            {c || "All cities"}
          </button>
        ))}
        <button onClick={() => setLive(!live)} className="ml-auto rounded-md bg-primary px-3 py-1.5 font-mono text-xs text-primary-foreground">
          {live ? "● LIVE — pause" : "Resume"}
        </button>
      </div>

      <div className="mt-4 overflow-auto rounded-xl border border-border bg-card">
        <table className="w-full font-mono text-[11px]">
          <thead className="text-left text-muted-foreground">
            <tr>{["Time", "Location", "Event", "Actors", "Risk", "TTC", "Speed", "Action", "Status"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-t border-border/60">
                <td className="px-3 py-1.5 text-muted-foreground">{new Date(e.timestamp).toLocaleTimeString()}</td>
                <td className="px-3 py-1.5">{e.location}, {e.city}</td>
                <td className="px-3 py-1.5">{e.type}</td>
                <td className="px-3 py-1.5 text-muted-foreground">{e.actors.join(" + ")}</td>
                <td className="px-3 py-1.5 font-bold" style={{ color: SEV[e.severity] }}>{(e.risk * 100).toFixed(0)}%</td>
                <td className="px-3 py-1.5">{e.ttc}s</td>
                <td className="px-3 py-1.5">{e.speedKmh} km/h</td>
                <td className="px-3 py-1.5">{e.action}</td>
                <td className="px-3 py-1.5">{e.status}</td>
              </tr>
            ))}
            {!events.length && <tr><td colSpan={9} className="py-6 text-center text-muted-foreground">Waiting for detections…</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  );
}
