import type {
  Actor,
  Decision,
  LogEntry,
  Metrics,
  PathPoint,
  Sample,
  Scenario,
  TrackedObject,
} from "./types";
import { KIND_LABEL } from "./scenarios";

const SENSOR_RANGE = 60;
const HORIZON = 3; // seconds of motion prediction
const PRED_STEPS = 6;
const REPLAN_INTERVAL = 0.2; // seconds
const EGO_W = 1.8;
const EGO_L = 4.3;

export interface EgoState {
  x: number;
  y: number;
  speed: number;
  heading: number; // radians, 0 = straight ahead
}

export interface SimState {
  ego: EgoState;
  actors: Actor[];
  tracks: TrackedObject[];
  path: PathPoint[];
  decision: Decision;
  decisionReason: string;
  risk: number;
  targetSpeed: number;
  metrics: Metrics;
  samples: Sample[];
  log: LogEntry[];
  finished: boolean;
  scenario: Scenario;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

function inflation(kind: Actor["kind"]) {
  switch (kind) {
    case "pedestrian":
    case "cattle":
      return 1.6;
    case "twowheeler":
    case "bicycle":
      return 1.2;
    case "pothole":
      return 0.5;
    default:
      return 1.0;
  }
}

export class Simulation {
  scenario: Scenario;
  ego: EgoState;
  actors: Actor[];
  tracks: TrackedObject[] = [];
  path: PathPoint[] = [];
  decision: Decision = "CRUISE";
  decisionReason = "Clear road ahead";
  risk = 0;
  targetSpeed: number;
  elapsed = 0;
  finished = false;
  log: LogEntry[] = [];
  samples: Sample[] = [];

  private sinceReplan = REPLAN_INTERVAL;
  private latencies: number[] = [];
  private headingDeltas: number[] = [];
  private detSeen = 0;
  private detTotal = 0;
  private collisions = 0;
  private collisionCooldown = 0;
  private lateralTarget = 0;
  private riskStart: number | null = null;
  private responses: number[] = [];
  private lastDecision: Decision = "CRUISE";

  constructor(scenario: Scenario) {
    this.scenario = scenario;
    this.actors = scenario.build();
    this.ego = { x: 0, y: 0, speed: scenario.cruise * 0.6, heading: 0 };
    this.targetSpeed = scenario.cruise;
    this.pushLog("info", `Scenario loaded: ${scenario.name}`);
  }

  private pushLog(level: LogEntry["level"], text: string) {
    this.log = [{ t: this.elapsed, level, text }, ...this.log].slice(0, 60);
  }

  step(dt: number) {
    if (this.finished) return;
    this.elapsed += dt;
    this.updateActors(dt);
    this.perceive();
    this.sinceReplan += dt;
    if (this.sinceReplan >= REPLAN_INTERVAL) {
      this.sinceReplan = 0;
      this.plan();
    }
    this.control(dt);
    this.checkCollision(dt);

    if (this.ego.y >= this.scenario.goal) {
      this.finished = true;
      this.pushLog("info", "Goal reached — scenario completed");
    }
    const lastSample = this.samples[this.samples.length - 1];
    if (!lastSample || this.elapsed - lastSample.t > 0.2) {
      this.samples.push({
        t: this.elapsed,
        speed: this.ego.speed,
        risk: this.risk,
        latency: this.latencies[this.latencies.length - 1] ?? 0,
      });
      if (this.samples.length > 400) this.samples.shift();
    }
  }

  // --- Environment ------------------------------------------------------
  private updateActors(dt: number) {
    const half = this.scenario.roadWidth / 2 + 1.5;
    for (const o of this.actors) {
      if (o.trigger && !o.trigger.fired) {
        const gap = o.y - this.ego.y;
        if (gap > 0 && gap < o.trigger.range) {
          o.trigger.fired = true;
          o.vx = o.trigger.vx;
          o.vy = o.trigger.vy;
          this.pushLog(
            "warn",
            `${KIND_LABEL[o.kind]} entering path at ${gap.toFixed(0)} m ahead`,
          );
        }
      }
      if (o.kind === "pothole") continue;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.x += (Math.sin((this.elapsed + o.y) * 0.9) * o.wander - o.wander / 2) * dt;
      o.x = clamp(o.x, -half, half);
    }
  }

  // --- Perception + tracking + prediction -------------------------------
  private perceive() {
    const tracks: TrackedObject[] = [];
    for (const o of this.actors) {
      const dx = o.x - this.ego.x;
      const dy = o.y - this.ego.y;
      const dist = Math.hypot(dx, dy);
      if (dy < -18 || dist > SENSOR_RANGE) continue;
      this.detTotal += 1;
      const size = Math.max(o.w, o.l);
      const conf = clamp(1.05 - dist / SENSOR_RANGE + size * 0.03, 0.35, 0.99);
      if (conf < 0.42) continue;
      this.detSeen += 1;

      const prediction: PathPoint[] = [];
      for (let i = 1; i <= PRED_STEPS; i += 1) {
        const t = (HORIZON * i) / PRED_STEPS;
        prediction.push({ x: o.x + o.vx * t, y: o.y + o.vy * t });
      }
      const relV = this.ego.speed - o.vy;
      const gap = dy - (o.l + EGO_L) / 2;
      const ttc = relV > 0.4 && dy > 0 ? gap / relV : null;
      const lateralOverlap = Math.abs(dx) < (o.w + EGO_W) / 2 + inflation(o.kind);
      let risk = 0;
      if (ttc !== null) risk = clamp(1 - ttc / 6, 0, 1) * (lateralOverlap ? 1 : 0.45);
      if (Math.abs(o.vx) > 0.5 && dy > 0 && dy < 30) risk = Math.max(risk, 0.55);
      tracks.push({
        id: o.id,
        kind: o.kind,
        x: o.x,
        y: o.y,
        vx: o.vx,
        vy: o.vy,
        w: o.w,
        l: o.l,
        distance: dist,
        confidence: conf,
        ttc,
        risk,
        prediction,
      });
    }
    tracks.sort((p, q) => p.distance - q.distance);
    this.tracks = tracks;
    this.risk = tracks.reduce((m, t) => Math.max(m, t.risk), 0);
  }

  // --- Planning ---------------------------------------------------------
  private candidatePath(offset: number, speed: number): PathPoint[] {
    const pts: PathPoint[] = [];
    const start = this.ego.x;
    for (let i = 0; i <= 12; i += 1) {
      const t = (i / 12) * HORIZON;
      const s = clamp(t / 2.2, 0, 1);
      const ease = s * s * (3 - 2 * s);
      pts.push({ x: start + (offset - start) * ease, y: this.ego.y + speed * t });
    }
    return pts;
  }

  private pathCost(path: PathPoint[], offset: number, speed: number) {
    const half = this.scenario.roadWidth / 2;
    if (Math.abs(offset) > half - EGO_W / 2) return Infinity;
    let cost = Math.abs(offset - this.ego.x) * 1.4 + Math.abs(offset) * 0.35;
    cost += (this.scenario.cruise - speed) * 0.9;
    for (const tr of this.tracks) {
      const pad = inflation(tr.kind) + (tr.w + EGO_W) / 2;
      const padY = (tr.l + EGO_L) / 2 + 1.2;
      for (let i = 0; i < path.length; i += 1) {
        const t = (i / 12) * HORIZON;
        const px = tr.x + tr.vx * t;
        const py = tr.y + tr.vy * t;
        const pt = path[i]!;
        const dx = Math.abs(pt.x - px);
        const dy = Math.abs(pt.y - py);
        if (dx < pad && dy < padY) return Infinity;
        const clearance = Math.max(0, dx - pad) + Math.max(0, dy - padY) * 0.2;
        if (clearance < 2.5) cost += (2.5 - clearance) * 3.5 * (1 - i / 16);
      }
    }
    return cost;
  }

  private plan() {
    const t0 =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const half = this.scenario.roadWidth / 2;
    const offsets: number[] = [];
    for (let o = -half + EGO_W / 2; o <= half - EGO_W / 2 + 0.001; o += 0.4) {
      offsets.push(Number(o.toFixed(2)));
    }
    const speeds = [
      this.scenario.cruise,
      this.scenario.cruise * 0.7,
      this.scenario.cruise * 0.45,
      this.scenario.cruise * 0.22,
    ];

    let best: { cost: number; path: PathPoint[]; offset: number; speed: number } | null =
      null;
    for (const speed of speeds) {
      for (const offset of offsets) {
        const path = this.candidatePath(offset, speed);
        const cost = this.pathCost(path, offset, speed);
        if (cost < (best?.cost ?? Infinity)) best = { cost, path, offset, speed };
      }
      if (best && best.cost < Infinity) break;
    }

    const latency =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0;
    this.latencies.push(latency);
    if (this.latencies.length > 200) this.latencies.shift();

    let decision: Decision;
    let reason: string;
    if (!best || best.cost === Infinity) {
      this.path = this.candidatePath(this.ego.x, 0);
      this.targetSpeed = 0;
      decision = "STOP";
      reason = "No collision-free path — full stop until the way clears";
    } else {
      this.path = best.path;
      this.targetSpeed = best.speed;
      this.lateralTarget = best.offset;
      const nearest = this.tracks[0];
      if (Math.abs(best.offset - this.ego.x) > 0.7 && this.risk > 0.3) {
        decision = "EVADE";
        reason = `Steering ${best.offset > this.ego.x ? "right" : "left"} around ${
          nearest ? KIND_LABEL[nearest.kind].toLowerCase() : "obstacle"
        }`;
      } else if (best.speed < this.scenario.cruise * 0.5) {
        decision = "SLOW";
        reason = nearest
          ? `Braking for ${KIND_LABEL[nearest.kind].toLowerCase()} at ${nearest.distance.toFixed(0)} m`
          : "Reducing speed for restricted visibility";
      } else if (best.speed < this.scenario.cruise) {
        decision = "FOLLOW";
        reason = nearest
          ? `Holding safe gap behind ${KIND_LABEL[nearest.kind].toLowerCase()}`
          : "Maintaining safe gap";
      } else {
        decision = "CRUISE";
        reason = "Path clear — maintaining cruise speed";
      }
    }

    if (this.risk > 0.5 && this.riskStart === null) this.riskStart = this.elapsed;
    if (decision !== this.lastDecision) {
      if (this.riskStart !== null && decision !== "CRUISE") {
        this.responses.push((this.elapsed - this.riskStart) * 1000);
        this.riskStart = null;
      }
      this.pushLog(
        decision === "STOP" || decision === "EVADE" ? "danger" : "info",
        `${decision}: ${reason}`,
      );
      this.lastDecision = decision;
    }
    if (this.risk < 0.3) this.riskStart = null;
    this.decision = decision;
    this.decisionReason = reason;
  }

  // --- Control ----------------------------------------------------------
  private control(dt: number) {
    const accel = this.targetSpeed > this.ego.speed ? 2.6 : 5.5;
    const dv = clamp(this.targetSpeed - this.ego.speed, -accel * dt, accel * dt);
    this.ego.speed = Math.max(0, this.ego.speed + dv);

    const lateralGain = 1.8;
    const dx = clamp(
      (this.lateralTarget - this.ego.x) * lateralGain * dt,
      -2.2 * dt,
      2.2 * dt,
    );
    const prevHeading = this.ego.heading;
    this.ego.x += dx;
    this.ego.heading = Math.atan2(dx, Math.max(0.5, this.ego.speed * dt));
    this.headingDeltas.push(Math.abs(this.ego.heading - prevHeading));
    if (this.headingDeltas.length > 400) this.headingDeltas.shift();
    this.ego.y += this.ego.speed * dt;
  }

  private checkCollision(dt: number) {
    this.collisionCooldown = Math.max(0, this.collisionCooldown - dt);
    for (const o of this.actors) {
      const dx = Math.abs(o.x - this.ego.x);
      const dy = Math.abs(o.y - this.ego.y);
      if (dx < (o.w + EGO_W) / 2 && dy < (o.l + EGO_L) / 2) {
        if (this.collisionCooldown === 0) {
          this.collisions += 1;
          this.collisionCooldown = 2;
          this.pushLog("danger", `Contact with ${KIND_LABEL[o.kind].toLowerCase()}`);
        }
      }
    }
  }

  // --- Metrics ----------------------------------------------------------
  get metrics(): Metrics {
    const avg = (arr: number[]) =>
      arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
    const jerk = avg(this.headingDeltas);
    return {
      replanLatency: avg(this.latencies.slice(-40)),
      replanCount: this.latencies.length,
      smoothness: clamp(100 - jerk * 2600, 0, 100),
      completion: clamp((this.ego.y / this.scenario.goal) * 100, 0, 100),
      collisions: this.collisions,
      detectionAccuracy: this.detTotal ? (this.detSeen / this.detTotal) * 100 : 100,
      responseTime: this.responses.length ? avg(this.responses) : 0,
      distance: this.ego.y,
      elapsed: this.elapsed,
    };
  }

  snapshot(): SimState {
    return {
      ego: { ...this.ego },
      actors: this.actors,
      tracks: this.tracks,
      path: this.path,
      decision: this.decision,
      decisionReason: this.decisionReason,
      risk: this.risk,
      targetSpeed: this.targetSpeed,
      metrics: this.metrics,
      samples: this.samples,
      log: this.log,
      finished: this.finished,
      scenario: this.scenario,
    };
  }
}

export const EGO_SIZE = { w: EGO_W, l: EGO_L };
export const SENSOR = SENSOR_RANGE;
