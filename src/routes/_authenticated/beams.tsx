import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { AppShell, EmptyState } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";
import { inr, kg, statsForBeam } from "@/lib/calc";

export const Route = createFileRoute("/_authenticated/beams")({ component: BeamsPage });

function BeamsPage() {
  const { jobworkers, machines, beams, submissions, settings, addBeam, closeBeam, reopenBeam, deleteBeam } = useStore();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"open" | "closed" | "all">("open");

  const [jwId, setJwId] = useState("");
  const [mId, setMId] = useState("");
  const [beamNumber, setBeamNumber] = useState("");
  const [warp, setWarp] = useState("");
  const [prep, setPrep] = useState(String(settings.defaultBeamPrepCharge));
  const [assignedDate, setAssignedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const availableMachines = machines.filter((m) => m.jobworkerId === jwId && !beams.find((b) => b.machineId === m.id && !b.closed));

  function save() {
    if (!jwId || !mId || !beamNumber.trim()) return;
    addBeam({
      jobworkerId: jwId,
      machineId: mId,
      beamNumber: beamNumber.trim(),
      warpWeightKg: parseFloat(warp) || 0,
      prepCharge: parseFloat(prep) || 0,
      assignedDate: new Date(assignedDate).toISOString(),
    });
    setBeamNumber(""); setWarp(""); setMId(""); setOpen(false);
  }

  const filtered = useMemo(() => {
    const rows = beams.slice().sort((a, b) => (a.closed === b.closed ? 0 : a.closed ? 1 : -1));
    if (tab === "open") return rows.filter((b) => !b.closed);
    if (tab === "closed") return rows.filter((b) => b.closed);
    return rows;
  }, [beams, tab]);

  return (
    <AppShell
      title="Beams"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button disabled={jobworkers.length === 0 || machines.length === 0}>+ Assign beam</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Assign warp beam</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Jobworker</Label>
                  <Select value={jwId} onValueChange={(v) => { setJwId(v); setMId(""); }}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{jobworkers.map((j) => <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Machine (free only)</Label>
                  <Select value={mId} onValueChange={setMId} disabled={!jwId}>
                    <SelectTrigger><SelectValue placeholder={jwId ? "Select" : "Pick jobworker"} /></SelectTrigger>
                    <SelectContent>
                      {availableMachines.length === 0 && <div className="px-2 py-3 text-xs text-muted-foreground">No free machines. Close an open beam first.</div>}
                      {availableMachines.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Beam number</Label><Input value={beamNumber} onChange={(e) => setBeamNumber(e.target.value)} placeholder="e.g. B-2045" /></div>
                <div><Label>Assigned date</Label><Input type="date" value={assignedDate} onChange={(e) => setAssignedDate(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Warp weight (kg)</Label><Input type="number" step="0.01" value={warp} onChange={(e) => setWarp(e.target.value)} /></div>
                <div><Label>Beam prep charge (₹)</Label><Input type="number" step="1" value={prep} onChange={(e) => setPrep(e.target.value)} /></div>
              </div>
            </div>
            <DialogFooter><Button onClick={save}>Assign beam</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mb-4">
        <TabsList>
          <TabsTrigger value="open">Open ({beams.filter((b) => !b.closed).length})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({beams.filter((b) => b.closed).length})</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <EmptyState title="No beams here" hint="Assign a beam to a jobworker's machine to start tracking pieces and weight against it." />
      ) : (
        <div className="grid gap-3">
          {filtered.map((b) => {
            const jw = jobworkers.find((j) => j.id === b.jobworkerId);
            const mc = machines.find((m) => m.id === b.machineId);
            const s = statsForBeam(b.id, submissions);
            const yieldPct = b.warpWeightKg > 0 ? (s.weightKg / b.warpWeightKg) * 100 : 0;
            return (
              <div key={b.id} className={`rounded-lg border bg-card p-5 ${b.closed ? "border-border opacity-75" : "border-border"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-display text-lg font-semibold">Beam {b.beamNumber}</div>
                      {b.closed ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Closed</span>
                      ) : (
                        <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-success">Open</span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {jw?.name} · {mc?.label} · assigned {format(new Date(b.assignedDate), "d MMM yyyy")}
                      {b.closed && b.closedDate && ` · closed ${format(new Date(b.closedDate), "d MMM yyyy")}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {b.closed ? (
                      <Button variant="outline" size="sm" onClick={() => reopenBeam(b.id)}>Reopen</Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => { if (confirm(`Close beam ${b.beamNumber}?`)) closeBeam(b.id); }}>Close beam</Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete beam and its submissions?")) deleteBeam(b.id); }}>Delete</Button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Warp weight</div><div className="mt-0.5 font-medium">{kg(b.warpWeightKg)}</div></div>
                  <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Fabric weight</div><div className="mt-0.5 font-medium">{kg(s.weightKg)}</div></div>
                  <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Yield</div><div className={`mt-0.5 font-medium ${yieldPct > 95 ? "text-destructive" : yieldPct < 70 && s.submissionCount > 0 ? "text-warning" : ""}`}>{yieldPct.toFixed(1)}%</div></div>
                  <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Pieces</div><div className="mt-0.5 font-medium">{s.pieces}</div></div>
                  <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Prep charge</div><div className="mt-0.5 font-medium">{inr(b.prepCharge)}</div></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
