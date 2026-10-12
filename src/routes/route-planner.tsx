import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const RouteMap = lazy(() => import("@/components/map/RouteMap"));

export const Route = createFileRoute("/route-planner")({
  head: () => ({
    meta: [
      { title: "Safe Route Planner — Indian Roads Map" },
      { name: "description", content: "Find road routes between 26 Indian landmarks with live collision hazards and adaptive ETA." },
      { property: "og:title", content: "Safe Route Planner — Indian Roads Map" },
      { property: "og:description", content: "Map-based route finder that flags live collision hazards along the way." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Planner,
});

function Planner() {
  const fallback = <div className="h-[640px] rounded-xl border border-border bg-card" />;
  return (
    <main className="mx-auto max-w-[1500px] px-5 py-5 font-sans text-foreground">
      <h1 className="text-lg font-bold">Safe Route Planner</h1>
      <p className="mb-4 font-mono text-xs text-muted-foreground">
        Road routing + live collision feed → hazards along route → adaptive ETA
      </p>
      <ClientOnly fallback={fallback}>
        <Suspense fallback={fallback}><RouteMap /></Suspense>
      </ClientOnly>
    </main>
  );
}
