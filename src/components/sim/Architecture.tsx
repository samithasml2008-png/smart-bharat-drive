const STAGES = [
  ["Sensor Simulation", "Camera · LiDAR · Radar fusion at 60 Hz"],
  ["Perception", "Free-space + road boundary without lane markings"],
  ["Object Detection & Tracking", "Persistent IDs, class, size, velocity"],
  ["Motion Prediction", "3 s constant-velocity horizon, 6 waypoints"],
  ["Risk Assessment", "Time-to-collision and lateral overlap scoring"],
  ["Decision Making", "Cruise · Follow · Slow · Evade · Stop"],
  ["Path Planning", "Lateral offset sampling with smoothed transitions"],
  ["Collision Checking", "Inflated footprint sweep over prediction set"],
  ["Vehicle Control", "Longitudinal + lateral tracking of chosen path"],
  ["Environment Update", "Actors step, ego pose integrates"],
  ["Replanning", "Every 200 ms or on new high-risk track"],
];

export function Architecture() {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {STAGES.map(([name, detail], i) => (
        <div
          key={name}
          className="rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-primary">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-sm font-medium text-foreground">{name}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
      ))}
    </div>
  );
}
