import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Simulation, type SimState } from "@/lib/sim/engine";
import { SCENARIOS, KIND_LABEL } from "@/lib/sim/scenarios";
import { SimCanvas } from "@/components/sim/SimCanvas";
import { Charts } from "@/components/sim/Charts";
import { Architecture } from "@/components/sim/Architecture";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Adaptive Path Planning for Unstructured Indian Roads" },
      {
        name: "description",
        content:
          "Autonomous driving simulation with perception, motion prediction, risk assessment, adaptive path planning and real-time replanning across five Indian road scenarios.",
      },
      { property: "og:title", content: "Adaptive Path Planning for Unstructured Indian Roads" },
      {
        property: "og:description",
        content:
          "Five-scenario autonomous vehicle simulator: detection, prediction, collision avoidance and live replanning metrics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const DECISION_STYLE: Record<string, string> = {
  CRUISE: "text-ok border-ok",
  FOLLOW: "text-primary border-primary",
  SLOW: "text-warn border-warn",
  EVADE: "text-warn border-warn",
  STOP: "text-danger border-danger",
};

function Dashboard() {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0]!.id);
  const [running, setRunning] = useState(false);
  const [state, setState] = useState<SimState | null>(null);
  const simRef = useRef<Simulation | null>(null);
  const runningRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const reset = useCallback(
    (id: string) => {
      const scenario = SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0]!;
      const sim = new Simulation(scenario);
      simRef.current = sim;
      setState(sim.snapshot());
      setRunning(false);
      runningRef.current = false;
    },
    [],
  );

  useEffect(() => {
    reset(scenarioId);
  }, [scenarioId, reset]);

  useEffect(() => {
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const sim = simRef.current;
      if (sim && runningRef.current) {
        sim.step(dt);
        if (sim.finished) {
          runningRef.current = false;
          setRunning(false);
        }
        setState(sim.snapshot());
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const toggle = () => {
    if (simRef.current?.finished) return;
    runningRef.current = !runningRef.current;
    setRunning(runningRef.current);
  };

  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0]!;
  const m = state?.metrics;

  return (
    <main className="min-h-screen bg-background font-sans text-foreground">
      <header className="border-b border-border px-5 py-4">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              Adaptive Path Planning &amp; Collision Avoidance
            </h1>
            <p className="font-mono text-xs text-muted-foreground">
              Autonomous navigation on unstructured Indian roads · simulation prototype
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="rounded-md bg-primary px-4 py-2 font-mono text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              {running ? "PAUSE" : "START"}
            </button>
            <button
              onClick={() => reset(scenarioId)}
              className="rounded-md border border-border px-4 py-2 font-mono text-xs text-foreground transition-colors hover:border-primary"
            >
              RESET
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-5">
        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => setScenarioId(s.id)}
              className={`rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                s.id === scenarioId
                  ? "border-primary bg-card text-foreground"
                  : "border-border text-muted-foreground hover:border-primary/60"
              }`}
            >
              <div className="font-medium">{s.name}</div>
              <div className="font-mono text-[10px] opacity-70">{s.goal} m route</div>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{scenario.summary}</p>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Live road view */}
          <section className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  Live road view
                </span>
                <span className="font-mono text-[11px] text-primary">
                  {running ? "● RUNNING" : state?.finished ? "✓ COMPLETE" : "❚❚ PAUSED"}
                </span>
              </div>
              <div className="h-[620px]">
                <SimCanvas state={state} />
              </div>
            </div>

            <div className="space-y-4">
              {/* Decision + speed */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div
                  className={`rounded-lg border bg-card p-3 ${
                    DECISION_STYLE[state?.decision ?? "CRUISE"]
                  }`}
                >
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    Decision
                  </div>
                  <div className="font-mono text-xl font-bold">{state?.decision}</div>
                </div>
                <div className="rounded-lg border border-border bg-card p-3">
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    Speed
                  </div>
                  <div className="font-mono text-xl font-bold text-foreground">
                    {(state?.ego.speed ?? 0).toFixed(1)}
                    <span className="text-sm text-muted-foreground"> m/s</span>
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    target {(state?.targetSpeed ?? 0).toFixed(1)} m/s ·{" "}
                    {((state?.ego.speed ?? 0) * 3.6).toFixed(0)} km/h
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-3">
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    Collision risk
                  </div>
                  <div
                    className="font-mono text-xl font-bold"
                    style={{
                      color:
                        (state?.risk ?? 0) > 0.6
                          ? "var(--color-danger)"
                          : (state?.risk ?? 0) > 0.3
                            ? "var(--color-warn)"
                            : "var(--color-ok)",
                    }}
                  >
                    {((state?.risk ?? 0) * 100).toFixed(0)}%
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-danger transition-all"
                      style={{ width: `${(state?.risk ?? 0) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-3">
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  Planner rationale
                </div>
                <p className="mt-1 font-mono text-sm text-foreground">
                  {state?.decisionReason}
                </p>
              </div>

              <Charts samples={state?.samples ?? []} />

              {/* Metrics */}
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Replanning latency", `${(m?.replanLatency ?? 0).toFixed(2)} ms`],
                  ["Path smoothness", `${(m?.smoothness ?? 100).toFixed(0)} / 100`],
                  ["Scenario completion", `${(m?.completion ?? 0).toFixed(0)} %`],
                  [
                    "Collision-free",
                    m?.collisions ? `${m.collisions} contact(s)` : "100 %",
                  ],
                  ["Detection accuracy", `${(m?.detectionAccuracy ?? 100).toFixed(1)} %`],
                  [
                    "Avg response time",
                    m?.responseTime ? `${m.responseTime.toFixed(0)} ms` : "—",
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-border bg-card p-3">
                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      {label}
                    </div>
                    <div className="font-mono text-lg font-bold text-foreground">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Right rail */}
          <aside className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Detected objects ({state?.tracks.length ?? 0})
              </div>
              <div className="mt-2 max-h-[300px] space-y-1 overflow-auto">
                {(state?.tracks ?? []).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-md border border-border/60 px-2 py-1.5 font-mono text-[11px]"
                  >
                    <span className="text-foreground">{KIND_LABEL[t.kind]}</span>
                    <span className="text-muted-foreground">
                      {t.distance.toFixed(0)} m ·{" "}
                      {t.ttc !== null ? `TTC ${t.ttc.toFixed(1)}s` : "TTC —"}
                    </span>
                    <span
                      style={{
                        color:
                          t.risk > 0.6
                            ? "var(--color-danger)"
                            : t.risk > 0.3
                              ? "var(--color-warn)"
                              : "var(--color-ok)",
                      }}
                    >
                      {(t.risk * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
                {!state?.tracks.length && (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    No objects in sensor range
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3">
              <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Event log
              </div>
              <div className="mt-2 max-h-[280px] space-y-1 overflow-auto">
                {(state?.log ?? []).map((e, i) => (
                  <div key={`${e.t}-${i}`} className="font-mono text-[11px]">
                    <span className="text-muted-foreground">{e.t.toFixed(1)}s </span>
                    <span
                      style={{
                        color:
                          e.level === "danger"
                            ? "var(--color-danger)"
                            : e.level === "warn"
                              ? "var(--color-warn)"
                              : "var(--color-foreground)",
                      }}
                    >
                      {e.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-6">
          <h2 className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Technical architecture pipeline
          </h2>
          <Architecture />
        </section>
      </div>
    </main>
  );
}
