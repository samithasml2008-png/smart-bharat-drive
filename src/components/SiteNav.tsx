import { Link } from "@tanstack/react-router";

const LINKS = [
  { to: "/", label: "Simulator" },
  { to: "/live-api", label: "Live Collision API" },
  { to: "/route-planner", label: "Route Planner" },
] as const;

export function SiteNav() {
  return (
    <nav className="flex gap-1 border-b border-border bg-card px-5 py-2 font-mono text-xs">
      {LINKS.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          activeOptions={{ exact: true }}
          className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground"
          activeProps={{ className: "rounded-md px-3 py-1.5 bg-primary text-primary-foreground" }}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
