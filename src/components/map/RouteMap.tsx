import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PLACES } from "@/lib/locations";
import type { CollisionEvent } from "@/lib/collision-feed";

interface RouteInfo { km: number; min: number; hazards: CollisionEvent[] }

function distKm(a: [number, number], b: [number, number]) {
  const R = 6371, dLat = ((b[0] - a[0]) * Math.PI) / 180, dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const dot = (color: string, size = 12) =>
  L.divIcon({ className: "", html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid #fff"></div>`, iconSize: [size, size] });

export default function RouteMap() {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const routeLayer = useRef<L.LayerGroup | null>(null);
  const [from, setFrom] = useState("cp");
  const [to, setTo] = useState("ig");
  const [info, setInfo] = useState<RouteInfo | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current).setView([22.5, 79], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(m);
    PLACES.forEach((p) => L.marker([p.lat, p.lng], { icon: dot("#3b82f6", 10) }).bindTooltip(`${p.name}, ${p.city}`).addTo(m));
    routeLayer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => { m.remove(); map.current = null; };
  }, []);

  const findRoute = async () => {
    const a = PLACES.find((p) => p.id === from)!, b = PLACES.find((p) => p.id === to)!;
    if (a.id === b.id) { setError("Pick two different locations."); return; }
    setError(""); setLoading(true);
    try {
      const [rRes, cRes] = await Promise.all([
        fetch(`https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`),
        fetch("/api/public/collisions?limit=50"),
      ]);
      const r = await rRes.json();
      const { events } = (await cRes.json()) as { events: CollisionEvent[] };
      const route = r.routes?.[0];
      if (!route) throw new Error("No road route found between these places.");
      const coords: [number, number][] = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
      const step = Math.max(1, Math.floor(coords.length / 300));
      const sampled = coords.filter((_, i) => i % step === 0);
      const hazards = events.filter((e) => sampled.some((c) => distKm(c, [e.lat, e.lng]) < 3));
      const layer = routeLayer.current!;
      layer.clearLayers();
      const line = L.polyline(coords, { color: hazards.length ? "#f59e0b" : "#22c55e", weight: 5 }).addTo(layer);
      L.marker([a.lat, a.lng], { icon: dot("#22c55e", 16) }).bindTooltip("Start: " + a.name).addTo(layer);
      L.marker([b.lat, b.lng], { icon: dot("#ef4444", 16) }).bindTooltip("Goal: " + b.name).addTo(layer);
      hazards.forEach((h) => L.circleMarker([h.lat, h.lng], { radius: 8, color: "#ef4444" }).bindTooltip(`${h.type} · risk ${(h.risk * 100).toFixed(0)}% · ${h.action}`).addTo(layer));
      map.current!.fitBounds(line.getBounds(), { padding: [30, 30] });
      // Adaptive ETA: each hazard on route adds delay from slowing / replanning
      const baseMin = route.duration / 60;
      setInfo({ km: route.distance / 1000, min: baseMin + hazards.reduce((s, h) => s + h.risk * 2, 0), hazards });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Route lookup failed.");
    } finally { setLoading(false); }
  };

  const sel = "rounded-md border border-border bg-background px-2 py-2 font-mono text-xs text-foreground";
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div ref={el} className="h-[640px] rounded-xl border border-border" />
      <aside className="space-y-3">
        <div className="rounded-xl border border-border bg-card p-3 space-y-2">
          <label className="block text-[11px] uppercase tracking-widest text-muted-foreground">From</label>
          <select className={sel + " w-full"} value={from} onChange={(e) => setFrom(e.target.value)}>
            {PLACES.map((p) => <option key={p.id} value={p.id}>{p.name}, {p.city}</option>)}
          </select>
          <label className="block text-[11px] uppercase tracking-widest text-muted-foreground">To</label>
          <select className={sel + " w-full"} value={to} onChange={(e) => setTo(e.target.value)}>
            {PLACES.map((p) => <option key={p.id} value={p.id}>{p.name}, {p.city}</option>)}
          </select>
          <button onClick={findRoute} disabled={loading} className="w-full rounded-md bg-primary py-2 font-mono text-xs text-primary-foreground disabled:opacity-50">
            {loading ? "PLANNING…" : "FIND SAFE ROUTE"}
          </button>
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
        {info && (
          <div className="rounded-xl border border-border bg-card p-3 font-mono text-xs space-y-1">
            <div>Distance: <b>{info.km.toFixed(1)} km</b></div>
            <div>Adaptive ETA: <b>{info.min.toFixed(0)} min</b></div>
            <div>Hazards on route: <b className={info.hazards.length ? "text-warn" : "text-ok"}>{info.hazards.length}</b></div>
            <div className="mt-2 max-h-[340px] space-y-1 overflow-auto">
              {info.hazards.map((h) => (
                <div key={h.id} className="rounded border border-border/60 px-2 py-1">
                  {h.type} — {h.location}<br />
                  <span className="text-muted-foreground">risk {(h.risk * 100).toFixed(0)}% · TTC {h.ttc}s · {h.action}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
