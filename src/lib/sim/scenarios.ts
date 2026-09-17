import type { Actor, ActorKind, Scenario } from "./types";

const SIZES: Record<ActorKind, { w: number; l: number }> = {
  car: { w: 1.8, l: 4.2 },
  bus: { w: 2.5, l: 11 },
  truck: { w: 2.5, l: 8.5 },
  auto: { w: 1.4, l: 2.6 },
  twowheeler: { w: 0.8, l: 1.9 },
  bicycle: { w: 0.7, l: 1.7 },
  pedestrian: { w: 0.6, l: 0.6 },
  pushcart: { w: 1.4, l: 2.2 },
  cattle: { w: 1.1, l: 2.3 },
  pothole: { w: 1.2, l: 1.2 },
};

export const KIND_LABEL: Record<ActorKind, string> = {
  car: "Car",
  bus: "Bus",
  truck: "Truck",
  auto: "Auto-rickshaw",
  twowheeler: "Two-wheeler",
  bicycle: "Bicycle",
  pedestrian: "Pedestrian",
  pushcart: "Pushcart",
  cattle: "Cattle",
  pothole: "Pothole",
};

let seq = 0;
function a(
  kind: ActorKind,
  x: number,
  y: number,
  vy: number,
  opts: Partial<Actor> = {},
): Actor {
  seq += 1;
  return {
    id: `${kind}-${seq}`,
    kind,
    x,
    y,
    vx: 0,
    vy,
    wander: kind === "pedestrian" || kind === "cattle" ? 0.35 : 0.08,
    ...SIZES[kind],
    ...opts,
  };
}

export const SCENARIOS: Scenario[] = [
  {
    id: "village",
    name: "Unmarked Village Road",
    summary: "Narrow strip, no lane markings, mixed slow traffic and potholes.",
    roadWidth: 6.5,
    goal: 230,
    cruise: 9,
    build: () => [
      a("bicycle", -1.4, 34, 4),
      a("pushcart", 1.2, 62, 1.6),
      a("pothole", -0.6, 80, 0),
      a("truck", 1.6, 120, -7, { wrongWay: false }),
      a("auto", -1.8, 96, 5.5),
      a("pedestrian", 2.6, 140, 0, {
        trigger: { range: 26, vx: -1.3, vy: 0.2 },
      }),
      a("pothole", 1.9, 168, 0),
      a("twowheeler", 0.4, 150, 6.5),
      a("cattle", -2.4, 196, 0, { trigger: { range: 30, vx: 0.9, vy: 0.1 } }),
    ],
  },
  {
    id: "intersection",
    name: "Busy Urban Intersection",
    summary: "Unsignalised crossing with informal merging from both sides.",
    roadWidth: 11,
    goal: 220,
    cruise: 10,
    build: () => [
      a("auto", -3.4, 40, 5),
      a("twowheeler", 2.8, 55, 8, { wander: 0.5 }),
      a("car", 0.2, 78, 4.5),
      a("bus", -9, 105, 0, { trigger: { range: 45, vx: 3.2, vy: 1.5 } }),
      a("twowheeler", 9, 112, 0, { trigger: { range: 40, vx: -3.6, vy: 2 } }),
      a("pedestrian", -5.4, 128, 0, { trigger: { range: 28, vx: 1.2, vy: 0 } }),
      a("car", 3.6, 150, -9, { wrongWay: true }),
      a("auto", -2.0, 172, 6),
      a("pedestrian", 5.2, 190, 0, { trigger: { range: 24, vx: -1.4, vy: 0 } }),
    ],
  },
  {
    id: "merge",
    name: "Highway Merge",
    summary: "Slow truck merges from the shoulder into fast-moving traffic.",
    roadWidth: 10.5,
    goal: 300,
    cruise: 18,
    build: () => [
      a("car", -2.6, 70, 15),
      a("car", 2.8, 110, 16),
      a("truck", -7.5, 150, 6, { trigger: { range: 70, vx: 1.8, vy: 2.5 } }),
      a("bus", 2.6, 200, 12),
      a("twowheeler", -1.0, 240, 13),
      a("car", 3.2, 265, 14),
    ],
  },
  {
    id: "market",
    name: "Dense Market Area",
    summary: "Crawling traffic with pedestrians, pushcarts and weaving bikes.",
    roadWidth: 8,
    goal: 180,
    cruise: 6,
    build: () => [
      a("pushcart", -2.2, 24, 0.8),
      a("pedestrian", 1.4, 36, 0.4, { trigger: { range: 16, vx: -1.1, vy: 0 } }),
      a("twowheeler", 2.4, 48, 4, { wander: 0.6 }),
      a("pedestrian", -3.0, 62, 0, { trigger: { range: 18, vx: 1.2, vy: 0.3 } }),
      a("auto", 0.6, 74, 3),
      a("pushcart", 2.8, 92, 0.6),
      a("pedestrian", 3.4, 108, 0, { trigger: { range: 20, vx: -1.5, vy: 0 } }),
      a("bicycle", -1.6, 118, 3.4),
      a("pedestrian", -3.4, 140, 0, { trigger: { range: 18, vx: 1.4, vy: 0 } }),
      a("auto", 1.8, 156, 2.5),
    ],
  },
  {
    id: "cattle",
    name: "Sudden Cattle Crossing",
    summary: "Open road, then a cow steps into the lane at close range.",
    roadWidth: 9,
    goal: 240,
    cruise: 14,
    build: () => [
      a("car", 2.4, 60, 12),
      a("twowheeler", -2.6, 95, 10),
      a("cattle", -5.6, 140, 0, { trigger: { range: 32, vx: 1.7, vy: 0.2 } }),
      a("cattle", -6.8, 148, 0, { trigger: { range: 30, vx: 1.4, vy: 0.4 } }),
      a("auto", 1.6, 190, 7),
      a("pedestrian", 4.4, 215, 0, { trigger: { range: 22, vx: -1.2, vy: 0 } }),
    ],
  },
];
