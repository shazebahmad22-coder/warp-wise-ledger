import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, EmptyState, Stat } from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { balanceFor, inr, kg } from "@/lib/calc";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: Dashboard });

function Dashboard() {
  const {
    jobworkers,
    machines,
    beams,
    submissions,
    qualities,
    ledger,
    seedDemo,
  } = useStore();

  const openBeams = beams.filter((b) => !b.closed);
  const totalPieces = submissions.reduce((a, s) => a + s.pieces, 0);
  const totalWeight = submissions.reduce((a, s) => a + s.weightKg, 0);

  const balances = jobworkers.map((j) => ({
    j,
    b: balanceFor(j.id, submissions, qualities, beams, ledger),
    machines: machines.filter((m) => m.jobworkerId === j.id).length,
  }));

  const totalOwed = balances.reduce((a, x) => a + Math.max(0, x.b.net), 0);
  const totalOwedBack = balances.reduce((a, x) => a + Math.max(0, -x.b.net), 0);

  return (
    <AppShell
      title="Dashboard"
      actions={
        jobworkers.length === 0 && (
          <Button variant="outline" onClick={seedDemo}>Load demo data</Button>
        )
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Jobworkers" value={jobworkers.length} sub={`${machines.length} machines`} />
        <Stat label="Open beams" value={openBeams.length} sub={`${beams.length} total`} />
        <Stat label="Pieces submitted" value={totalPieces.toLocaleString("en-IN")} sub={kg(totalWeight)} />
        <Stat label="Owed to jobworkers" value={inr(totalOwed)} sub={`They owe: ${inr(totalOwedBack)}`} />
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Jobworker balances</h2>
          <Link to="/jobworkers" className="text-sm text-muted-foreground hover:text-foreground">Manage →</Link>
        </div>

        {balances.length === 0 ? (
          <EmptyState
            title="No jobworkers yet"
            hint="Add your first jobworker to start assigning machines, beams and recording submissions."
            action={
              <Link to="/jobworkers"><Button>Add jobworker</Button></Link>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Jobworker</th>
                  <th className="px-4 py-3 text-right font-medium">Machines</th>
                  <th className="px-4 py-3 text-right font-medium">Earned</th>
                  <th className="px-4 py-3 text-right font-medium">Paid / Advance</th>
                  <th className="px-4 py-3 text-right font-medium">Beam charges</th>
                  <th className="px-4 py-3 text-right font-medium">Net balance</th>
                </tr>
              </thead>
              <tbody>
                {balances.map(({ j, b, machines }) => (
                  <tr key={j.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{j.name}</td>
                    <td className="px-4 py-3 text-right">{machines}</td>
                    <td className="px-4 py-3 text-right">{inr(b.earned)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {inr(b.payments)} <span className="text-xs">/ {inr(b.advances)}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{inr(b.beamCharges)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${b.net > 0 ? "text-success" : b.net < 0 ? "text-destructive" : ""}`}>
                      {b.net >= 0 ? inr(b.net) : `(${inr(-b.net)})`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {openBeams.length > 0 && (
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Open beams</h2>
            <Link to="/beams" className="text-sm text-muted-foreground hover:text-foreground">All beams →</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {openBeams.slice(0, 6).map((b) => {
              const jw = jobworkers.find((j) => j.id === b.jobworkerId);
              const mc = machines.find((m) => m.id === b.machineId);
              const subs = submissions.filter((s) => s.beamId === b.id);
              const pieces = subs.reduce((a, s) => a + s.pieces, 0);
              const weight = subs.reduce((a, s) => a + s.weightKg, 0);
              return (
                <div key={b.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-baseline justify-between">
                    <div className="font-display text-base font-semibold">Beam {b.beamNumber}</div>
                    <div className="text-xs text-muted-foreground">{mc?.label}</div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{jw?.name}</div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Warp</div><div className="text-sm font-medium">{kg(b.warpWeightKg)}</div></div>
                    <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Pieces</div><div className="text-sm font-medium">{pieces}</div></div>
                    <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Weight</div><div className="text-sm font-medium">{kg(weight)}</div></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AppShell>
  );
}
