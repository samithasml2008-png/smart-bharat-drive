import { useEffect, useRef } from "react";
import type { SimState } from "@/lib/sim/engine";
import { EGO_SIZE, SENSOR } from "@/lib/sim/engine";
import { KIND_LABEL } from "@/lib/sim/scenarios";
import type { ActorKind } from "@/lib/sim/types";

const COLORS: Record<ActorKind, string> = {
  car: "#7dd3fc",
  bus: "#fbbf24",
  truck: "#fb923c",
  auto: "#facc15",
  twowheeler: "#c4b5fd",
  bicycle: "#a7f3d0",
  pedestrian: "#f472b6",
  pushcart: "#d6d3d1",
  cattle: "#fca5a5",
  pothole: "#57534e",
};

const AHEAD = 62;
const BEHIND = 14;

export function SimCanvas({ state }: { state: SimState | null }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !state) return;
    const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = rect.width;
    const H = rect.height;
    const scale = H / (AHEAD + BEHIND);
    const ego = state.ego;
    const toPx = (x: number, y: number) => ({
      px: W / 2 + x * scale,
      py: H - (y - ego.y + BEHIND) * scale,
    });

    ctx.fillStyle = "#0b1015";
    ctx.fillRect(0, 0, W, H);

    // road surface
    const half = state.scenario.roadWidth / 2;
    const left = toPx(-half, 0).px;
    const right = toPx(half, 0).px;
    ctx.fillStyle = "#171d24";
    ctx.fillRect(left, 0, right - left, H);

    // drivable boundary estimate (perception output, dashed)
    ctx.strokeStyle = "#2dd4bf";
    ctx.setLineDash([10, 8]);
    ctx.lineWidth = 2;
    for (const edge of [left, right]) {
      ctx.beginPath();
      ctx.moveTo(edge, 0);
      ctx.lineTo(edge, H);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // distance grid
    ctx.strokeStyle = "rgba(148,163,184,0.12)";
    ctx.fillStyle = "rgba(148,163,184,0.5)";
    ctx.font = "10px ui-monospace, monospace";
    const startM = Math.floor((ego.y - BEHIND) / 10) * 10;
    for (let m = startM; m < ego.y + AHEAD; m += 10) {
      const { py } = toPx(0, m);
      ctx.beginPath();
      ctx.moveTo(left, py);
      ctx.lineTo(right, py);
      ctx.stroke();
      ctx.fillText(`${Math.round(m - ego.y)}m`, right + 6, py + 3);
    }

    // sensor cone
    const egoPx = toPx(ego.x, ego.y);
    const grad = ctx.createRadialGradient(
      egoPx.px,
      egoPx.py,
      4,
      egoPx.px,
      egoPx.py,
      SENSOR * scale,
    );
    grad.addColorStop(0, "rgba(45,212,191,0.16)");
    grad.addColorStop(1, "rgba(45,212,191,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(egoPx.px, egoPx.py, SENSOR * scale, 0, Math.PI * 2);
    ctx.fill();

    // undetected actors (ghosts)
    const tracked = new Set(state.tracks.map((t) => t.id));
    for (const o of state.actors) {
      if (tracked.has(o.id)) continue;
      const p = toPx(o.x, o.y);
      if (p.py < -50 || p.py > H + 50) continue;
      ctx.fillStyle = "rgba(100,116,139,0.35)";
      ctx.fillRect(p.px - (o.w * scale) / 2, p.py - (o.l * scale) / 2, o.w * scale, o.l * scale);
    }

    // planned path
    if (state.path.length) {
      ctx.strokeStyle = state.decision === "STOP" ? "#f87171" : "#34d399";
      ctx.lineWidth = 3;
      ctx.beginPath();
      state.path.forEach((pt, i) => {
        const p = toPx(pt.x, pt.y);
        if (i === 0) ctx.moveTo(p.px, p.py);
        else ctx.lineTo(p.px, p.py);
      });
      ctx.stroke();
      ctx.fillStyle = "rgba(52,211,153,0.9)";
      for (const pt of state.path) {
        const p = toPx(pt.x, pt.y);
        ctx.beginPath();
        ctx.arc(p.px, p.py, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // tracked objects
    for (const t of state.tracks) {
      const p = toPx(t.x, t.y);
      const w = t.w * scale;
      const l = t.l * scale;
      const color = COLORS[t.kind];
      ctx.fillStyle = color;
      if (t.kind === "pedestrian" || t.kind === "cattle") {
        ctx.beginPath();
        ctx.arc(p.px, p.py, Math.max(4, w / 2), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(p.px - w / 2, p.py - l / 2, w, l);
      }

      // bounding box + label
      ctx.strokeStyle = t.risk > 0.6 ? "#f87171" : t.risk > 0.3 ? "#fbbf24" : "#38bdf8";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(p.px - w / 2 - 4, p.py - l / 2 - 4, w + 8, l + 8);
      ctx.fillStyle = "rgba(226,232,240,0.9)";
      ctx.font = "10px ui-monospace, monospace";
      ctx.fillText(
        `${KIND_LABEL[t.kind]} ${t.distance.toFixed(0)}m ${(t.confidence * 100).toFixed(0)}%`,
        p.px + w / 2 + 6,
        p.py - l / 2 - 6,
      );

      // predicted trajectory
      ctx.strokeStyle = t.risk > 0.5 ? "rgba(248,113,113,0.8)" : "rgba(148,163,184,0.6)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(p.px, p.py);
      for (const q of t.prediction) {
        const pp = toPx(q.x, q.y);
        ctx.lineTo(pp.px, pp.py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ego vehicle
    const ew = EGO_SIZE.w * scale;
    const el = EGO_SIZE.l * scale;
    ctx.save();
    ctx.translate(egoPx.px, egoPx.py);
    ctx.rotate(-ego.heading);
    ctx.fillStyle = "#22d3ee";
    ctx.fillRect(-ew / 2, -el / 2, ew, el);
    ctx.fillStyle = "#0b1015";
    ctx.fillRect(-ew / 2 + 2, -el / 2 + 3, ew - 4, el * 0.25);
    ctx.restore();
    ctx.strokeStyle = "rgba(34,211,238,0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(egoPx.px - ew / 2 - 5, egoPx.py - el / 2 - 5, ew + 10, el + 10);

    if (state.decision === "STOP" || state.risk > 0.75) {
      ctx.strokeStyle = "rgba(248,113,113,0.85)";
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, W - 4, H - 4);
    }
  }, [state]);

  return <canvas ref={ref} className="h-full w-full rounded-lg" />;
}
