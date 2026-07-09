import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { AppShell, EmptyState } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { inr, kg } from "@/lib/calc";

export const Route = createFileRoute("/_authenticated/submissions")({ component: SubmissionsPage });

function SubmissionsPage() {
  const { jobworkers, machines, beams, qualities, submissions, addSubmission, deleteSubmission } = useStore();
  const [open, setOpen] = useState(false);
  const [filterJw, setFilterJw] = useState("all");

  const [jwId, setJwId] = useState("");
  const [mId, setMId] = useState("");
  const [beamId, setBeamId] = useState("");
  const [qId, setQId] = useState("");
  const [pieces, setPieces] = useState("");
  const [weight, setWeight] = useState("");
  const [weekEnding, setWeekEnding] = useState(format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"));

  const jwMachines = machines.filter((m) => m.jobworkerId === jwId);
  const machineOpenBeam = beams.find((b) => b.machineId === mId && !b.closed);

  // Auto-select the open beam for the picked machine
  const effectiveBeamId = beamId || machineOpenBeam?.id || "";

  function save() {
    const p = parseInt(pieces, 10);
    const w = parseFloat(weight);
    if (!jwId || !mId || !effectiveBeamId || !qId || isNaN(p) || isNaN(w)) return;
    addSubmission({
      jobworkerId: jwId,
      machineId: mId,
      beamId: effectiveBeamId,
      qualityId: qId,
      pieces: p,
      weightKg: w,
      weekEnding: new Date(weekEnding).toISOString(),
    });
    setPieces(""); setWeight(""); setOpen(false);
  }

  const visible = useMemo(() => {
    const rows = submissions.filter((s) => filterJw === "all" || s.jobworkerId === filterJw);
    return rows.sort((a, b) => new Date(b.weekEnding).getTime() - new Date(a.weekEnding).getTime());
  }, [submissions, filterJw]);

  // Weekly summary
  const currentWeek = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const rows = submissions.filter((s) => new Date(s.weekEnding) >= start);
    const pieces = rows.reduce((a, r) => a + r.pieces, 0);
    const weight = rows.reduce((a, r) => a + r.weightKg, 0);
    return { pieces, weight, count: rows.length };
  }, [submissions]);

  const canRecord = jobworkers.length > 0 && machines.length > 0 && qualities.length > 0 && beams.some((b) => !b.closed);

  return (
    <AppShell
      title="Submissions"
      actions={
        <>
          {jobworkers.length > 0 && (
            <Select value={filterJw} onValueChange={setFilterJw}>
              <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All jobworkers</SelectItem>
                {jobworkers.map((j) => <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button disabled={!canRecord}>+ Record submission</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Record weekly submission</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Jobworker</Label>
                    <Select value={jwId} onValueChange={(v) => { setJwId(v); setMId(""); setBeamId(""); }}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{jobworkers.map((j) => <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Machine</Label>
                    <Select value={mId} onValueChange={(v) => { setMId(v); setBeamId(""); }} disabled={!jwId}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{jwMachines.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                {mId && (
                  <div className="rounded-md bg-muted px-3 py-2 text-xs">
                    {machineOpenBeam ? <>Assigned beam: <span className="font-semibold">Beam {machineOpenBeam.beamNumber}</span> (auto-linked)</> : <span className="text-destructive">No open beam on this machine — assign one first.</span>}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Quality</Label>
                    <Select value={qId} onValueChange={setQId}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{qualities.map((q) => <SelectItem key={q.id} value={q.id}>{q.name} · {inr(q.ratePerPiece)}/pc</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Week ending</Label>
                    <Input type="date" value={weekEnding} onChange={(e) => setWeekEnding(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Pieces</Label><Input type="number" min={0} value={pieces} onChange={(e) => setPieces(e.target.value)} /></div>
                  <div><Label>Total weight (kg)</Label><Input type="number" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} /></div>
                </div>
              </div>
              <DialogFooter><Button onClick={save} disabled={!machineOpenBeam}>Save submission</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      }
    >
      {!canRecord && (
        <div className="mb-4 rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm">
          <div className="font-medium">Before recording a submission, set up:</div>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            {jobworkers.length === 0 && <li>• Add a <Link to="/jobworkers" className="underline text-foreground">jobworker</Link></li>}
            {machines.length === 0 && <li>• Add <Link to="/machines" className="underline text-foreground">machines</Link> for the jobworker</li>}
            {qualities.length === 0 && <li>• Add fabric <Link to="/qualities" className="underline text-foreground">qualities</Link> with piece rates</li>}
            {!beams.some((b) => !b.closed) && <li>• Assign an open <Link to="/beams" className="underline text-foreground">beam</Link> to a machine</li>}
          </ul>
        </div>
      )}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">This week</div><div className="mt-1 font-display text-xl font-semibold">{currentWeek.pieces} pieces</div><div className="text-xs text-muted-foreground">{kg(currentWeek.weight)} · {currentWeek.count} entries</div></div>
        <div className="rounded-lg border border-border bg-card p-4"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">All-time pieces</div><div className="mt-1 font-display text-xl font-semibold">{submissions.reduce((a, s) => a + s.pieces, 0).toLocaleString("en-IN")}</div></div>
        <div className="rounded-lg border border-border bg-card p-4"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">All-time weight</div><div className="mt-1 font-display text-xl font-semibold">{kg(submissions.reduce((a, s) => a + s.weightKg, 0))}</div></div>
      </div>

      {visible.length === 0 ? (
        <EmptyState title="No submissions yet" hint="Record what each jobworker submits per machine, per week. Pieces and weight are auto-tracked against the machine's open beam." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Week ending</th>
                <th className="px-4 py-3 text-left font-medium">Jobworker</th>
                <th className="px-4 py-3 text-left font-medium">Machine</th>
                <th className="px-4 py-3 text-left font-medium">Beam</th>
                <th className="px-4 py-3 text-left font-medium">Quality</th>
                <th className="px-4 py-3 text-right font-medium">Pieces</th>
                <th className="px-4 py-3 text-right font-medium">Weight</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => {
                const jw = jobworkers.find((j) => j.id === s.jobworkerId);
                const mc = machines.find((m) => m.id === s.machineId);
                const bm = beams.find((b) => b.id === s.beamId);
                const q = qualities.find((x) => x.id === s.qualityId);
                const amount = q ? s.pieces * q.ratePerPiece : 0;
                return (
                  <tr key={s.id} className="border-t border-border">
                    <td className="px-4 py-3 text-muted-foreground">{format(new Date(s.weekEnding), "d MMM yyyy")}</td>
                    <td className="px-4 py-3 font-medium">{jw?.name}</td>
                    <td className="px-4 py-3">{mc?.label}</td>
                    <td className="px-4 py-3 text-muted-foreground">{bm ? `Beam ${bm.beamNumber}` : "—"}</td>
                    <td className="px-4 py-3">{q?.name}</td>
                    <td className="px-4 py-3 text-right font-medium">{s.pieces}</td>
                    <td className="px-4 py-3 text-right">{kg(s.weightKg)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{inr(amount)}</td>
                    <td className="px-4 py-3 text-right"><Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this submission?")) deleteSubmission(s.id); }}>×</Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
