import { PLACES } from "./locations";

export interface CollisionEvent {
  id: string;
  timestamp: string;
  location: string;
  city: string;
  lat: number;
  lng: number;
  type: string;
  actors: string[];
  severity: "low" | "medium" | "high";
  risk: number;
  ttc: number;
  speedKmh: number;
  action: "CRUISE" | "SLOW" | "EVADE" | "STOP";
  status: "predicted" | "avoided" | "near-miss";
}

const TYPES = [
  ["Pedestrian crossing", ["pedestrian", "car"]],
  ["Wrong-way two-wheeler", ["twowheeler", "auto"]],
  ["Cattle on carriageway", ["cattle", "truck"]],
  ["Bus cut-in", ["bus", "car"]],
  ["Auto-rickshaw swerve", ["auto", "bicycle"]],
  ["Pothole obstacle", ["pothole", "car"]],
  ["Pushcart merge", ["pushcart", "twowheeler"]],
  ["Sudden truck brake", ["truck", "car"]],
] as const;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Deterministic per-second detection events, so every client sees the same live feed. */
export function eventsAt(nowMs: number, count = 20): CollisionEvent[] {
  const out: CollisionEvent[] = [];
  const sec = Math.floor(nowMs / 1000);
  for (let i = 0; i < count; i++) {
    const t = sec - i * 3;
    const r = rng(t * 7919);
    const p = PLACES[Math.floor(r() * PLACES.length)]!;
    const [type, actors] = TYPES[Math.floor(r() * TYPES.length)]!;
    const risk = Math.round(r() * 100) / 100;
    const ttc = Math.round((0.5 + (1 - risk) * 5) * 10) / 10;
    const severity = risk > 0.7 ? "high" : risk > 0.4 ? "medium" : "low";
    const action = risk > 0.8 ? "STOP" : risk > 0.6 ? "EVADE" : risk > 0.35 ? "SLOW" : "CRUISE";
    out.push({
      id: `evt-${t}`,
      timestamp: new Date(t * 1000).toISOString(),
      location: p.name,
      city: p.city,
      lat: p.lat + (r() - 0.5) * 0.02,
      lng: p.lng + (r() - 0.5) * 0.02,
      type,
      actors: [...actors],
      severity,
      risk,
      ttc,
      speedKmh: Math.round(10 + r() * 50),
      action,
      status: risk > 0.85 ? "near-miss" : risk > 0.35 ? "avoided" : "predicted",
    });
  }
  return out;
}
