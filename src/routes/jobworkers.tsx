import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, EmptyState } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { balanceFor, inr } from "@/lib/calc";

export const Route = createFileRoute("/jobworkers")({ component: JobworkersPage });

function JobworkersPage() {
  const { jobworkers, machines, submissions, qualities, beams, ledger, addJobworker, updateJobworker, deleteJobworker } = useStore();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  function reset() { setName(""); setPhone(""); setNotes(""); setEditId(null); }
  function openEdit(id: string) {
    const j = jobworkers.find((x) => x.id === id);
    if (!j) return;
    setEditId(id); setName(j.name); setPhone(j.phone || ""); setNotes(j.notes || ""); setOpen(true);
  }
  function save() {
    if (!name.trim()) return;
    if (editId) updateJobworker(editId, { name: name.trim(), phone, notes });
    else addJobworker({ name: name.trim(), phone, notes });
    reset(); setOpen(false);
  }

  return (
    <AppShell
      title="Jobworkers"
      actions={
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild><Button>+ New jobworker</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Edit jobworker" : "Add jobworker"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ramesh Patel" /></div>
              <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" /></div>
              <div><Label>Notes</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" /></div>
            </div>
            <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      {jobworkers.length === 0 ? (
        <EmptyState title="No jobworkers yet" hint="Add jobworkers who run machines in your factory." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Phone</th>
                <th className="px-4 py-3 text-right font-medium">Machines</th>
                <th className="px-4 py-3 text-right font-medium">Open beams</th>
                <th className="px-4 py-3 text-right font-medium">Net balance</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {jobworkers.map((j) => {
                const mCount = machines.filter((m) => m.jobworkerId === j.id).length;
                const openBeams = beams.filter((b) => b.jobworkerId === j.id && !b.closed).length;
                const bal = balanceFor(j.id, submissions, qualities, beams, ledger);
                return (
                  <tr key={j.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{j.name}{j.notes && <div className="text-xs text-muted-foreground">{j.notes}</div>}</td>
                    <td className="px-4 py-3 text-muted-foreground">{j.phone || "—"}</td>
                    <td className="px-4 py-3 text-right">{mCount}</td>
                    <td className="px-4 py-3 text-right">{openBeams}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${bal.net > 0 ? "text-success" : bal.net < 0 ? "text-destructive" : ""}`}>
                      {bal.net >= 0 ? inr(bal.net) : `(${inr(-bal.net)})`}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(j.id)}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => { if (confirm(`Delete ${j.name} and all their machines/beams/submissions?`)) deleteJobworker(j.id); }}>Delete</Button>
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
