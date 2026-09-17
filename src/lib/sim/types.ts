export type ActorKind =
  | "car"
  | "bus"
  | "truck"
  | "auto"
  | "twowheeler"
  | "bicycle"
  | "pedestrian"
  | "pushcart"
  | "cattle"
  | "pothole";

export interface Actor {
  id: string;
  kind: ActorKind;
  x: number; // lateral meters, 0 = road centre
  y: number; // longitudinal meters
  vx: number;
  vy: number;
  w: number;
  l: number;
  wander: number;
  wrongWay?: boolean;
  /** behaviour trigger: fires once when ego is within `range` metres behind */
  trigger?: { range: number; vx: number; vy: number; fired?: boolean };
}

export interface TrackedObject {
  id: string;
  kind: ActorKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  l: number;
  distance: number;
  confidence: number;
  ttc: number | null;
  risk: number;
  prediction: { x: number; y: number }[];
}

export type Decision = "CRUISE" | "FOLLOW" | "SLOW" | "EVADE" | "STOP";

export interface PathPoint {
  x: number;
  y: number;
}

export interface Metrics {
  replanLatency: number;
  replanCount: number;
  smoothness: number;
  completion: number;
  collisions: number;
  detectionAccuracy: number;
  responseTime: number;
  distance: number;
  elapsed: number;
}

export interface Sample {
  t: number;
  speed: number;
  risk: number;
  latency: number;
}

export interface LogEntry {
  t: number;
  level: "info" | "warn" | "danger";
  text: string;
}

export interface Scenario {
  id: string;
  name: string;
  summary: string;
  roadWidth: number;
  goal: number;
  cruise: number; // m/s
  build: () => Actor[];
}
