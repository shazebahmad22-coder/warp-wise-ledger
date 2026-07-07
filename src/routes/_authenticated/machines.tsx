import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, EmptyState } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/machines")({ component: MachinesPage });

function MachinesPage() {
  const { jobworkers, machines, beams, addMachine, addMachinesBulk, updateMachine, deleteMachine } = useStore();
  const [open, setOpen] = useState(false);
  const [jwId, setJwId] = useState<string>("");
  const [label, setLabel] = useState("");
  const [bulkCount, setBulkCount] = useState("");
  const [bulkPrefix, setBulkPrefix] = useState("M-");
  const [filter, setFilter] = useState<string>("all");

  function saveSingle() {
    if (!jwId || !label.trim()) return;
    addMachine({ jobworkerId: jwId, label: label.trim() });
    setLabel(""); setOpen(false);
  }
  function saveBulk() {
    const n = parseInt(bulkCount, 10);
    if (!jwId || !n || n <= 0) return;
    addMachinesBulk(jwId, n, bulkPrefix);
    setBulkCount(""); setOpen(false);
  }

  const visible = machines.filter((m) => filter === "all" || m.jobworkerId === filter);

  return (
    <AppShell
      title="Machines"
      actions={
        <>
          {jobworkers.length > 0 && (
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All jobworkers</SelectItem>
                {jobworkers.map((j) => <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button disabled={jobworkers.length === 0}>+ Add machines</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add machines</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Jobworker</Label>
                  <Select value={jwId} onValueChange={setJwId}>
                    <SelectTrigger><SelectValue placeholder="Select jobworker" /></SelectTrigger>
                    <SelectContent>{jobworkers.map((j) => <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="rounded-md border border-border p-4">
                  <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Bulk add</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Count</Label><Input type="number" min={1} value={bulkCount} onChange={(e) => setBulkCount(e.target.value)} placeholder="e.g. 12" /></div>
                    <div><Label>Prefix</Label><Input value={bulkPrefix} onChange={(e) => setBulkPrefix(e.target.value)} /></div>
                  </div>
                  <Button className="mt-3 w-full" variant="secondary" onClick={saveBulk}>Add {bulkCount || "N"} machines</Button>
                </div>
                <div className="rounded-md border border-border p-4">
                  <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Single machine</div>
                  <div><Label>Label</Label><Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. M-14" /></div>
                  <Button className="mt-3 w-full" variant="secondary" onClick={saveSingle}>Add machine</Button>
                </div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Close</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      }
    >
      {machines.length === 0 ? (
        <EmptyState title="No machines yet" hint={jobworkers.length === 0 ? "Add a jobworker first, then assign machines." : "Add machines and assign them to a jobworker."} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Machine</th>
                <th className="px-4 py-3 text-left font-medium">Jobworker</th>
                <th className="px-4 py-3 text-left font-medium">Current beam</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((m) => {
                const jw = jobworkers.find((j) => j.id === m.jobworkerId);
                const currentBeam = beams.find((b) => b.machineId === m.id && !b.closed);
                return (
                  <tr key={m.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">
                      <Input
                        value={m.label}
                        onChange={(e) => updateMachine(m.id, { label: e.target.value })}
                        className="h-8 max-w-[140px]"
                      />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{jw?.name}</td>
                    <td className="px-4 py-3">{currentBeam ? <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">Beam {currentBeam.beamNumber}</span> : <span className="text-xs text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => { if (confirm(`Delete ${m.label}?`)) deleteMachine(m.id); }}>Delete</Button>
                    </td>
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
