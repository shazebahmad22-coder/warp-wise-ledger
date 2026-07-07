import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: "◆" },
  { to: "/jobworkers", label: "Jobworkers", icon: "◉" },
  { to: "/machines", label: "Machines", icon: "▤" },
  { to: "/qualities", label: "Qualities", icon: "◈" },
  { to: "/beams", label: "Beams", icon: "◍" },
  { to: "/submissions", label: "Submissions", icon: "▦" },
  { to: "/ledger", label: "Ledger", icon: "₹" },
  { to: "/settings", label: "Settings", icon: "⚙" },
] as const;

export function AppShell({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const factoryName = useStore((s) => s.settings.factoryName);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="px-5 py-6">
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Loom Ledger</div>
          <div className="mt-1 font-display text-lg font-semibold leading-tight text-sidebar-foreground">{factoryName}</div>
        </div>
        <nav className="flex-1 space-y-0.5 px-3">
          {nav.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}
              >
                <span className="w-4 text-center text-base leading-none">{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-4 text-[10px] text-muted-foreground">
          Local browser data · v1
        </div>
      </aside>

      <div className="lg:pl-60">
        {/* mobile nav */}
        <div className="sticky top-0 z-20 flex items-center gap-1 overflow-x-auto border-b border-border bg-background/95 px-2 py-2 backdrop-blur lg:hidden">
          {nav.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "shrink-0 rounded-md px-3 py-1.5 text-xs",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </div>

        <header className="border-b border-border bg-background">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 md:px-8">
            <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">{mounted ? children : null}</main>
      </div>
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center">
      <div className="font-display text-lg font-medium">{title}</div>
      {hint && <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{hint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-2xl font-semibold tracking-tight">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
