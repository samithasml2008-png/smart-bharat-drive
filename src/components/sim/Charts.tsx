import type { Sample } from "@/lib/sim/types";

function Spark({
  data,
  color,
  max,
  unit,
  label,
}: {
  data: number[];
  color: string;
  max: number;
  unit: string;
  label: string;
}) {
  const w = 300;
  const h = 64;
  const pts = data.slice(-120);
  const step = pts.length > 1 ? w / (pts.length - 1) : w;
  const d = pts
    .map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(h - (Math.min(v, max) / max) * h).toFixed(1)}`)
    .join(" ");
  const last = pts.length ? pts[pts.length - 1] : 0;
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <span className="font-mono text-sm" style={{ color }}>
          {last.toFixed(1)}
          <span className="text-muted-foreground"> {unit}</span>
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="mt-2 h-16 w-full">
        <path d={`${d} L${w},${h} L0,${h} Z`} fill={color} opacity={0.12} />
        <path d={d} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

export function Charts({ samples }: { samples: Sample[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Spark
        label="Speed profile"
        unit="m/s"
        color="var(--color-accent)"
        max={22}
        data={samples.map((s) => s.speed)}
      />
      <Spark
        label="Collision risk"
        unit="idx"
        color="var(--color-danger)"
        max={1}
        data={samples.map((s) => s.risk)}
      />
      <Spark
        label="Replanning latency"
        unit="ms"
        color="var(--color-primary)"
        max={12}
        data={samples.map((s) => s.latency)}
      />
    </div>
  );
}
