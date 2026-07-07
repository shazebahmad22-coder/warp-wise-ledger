import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, EmptyState } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { inr } from "@/lib/calc";

export const Route = createFileRoute("/qualities")({ component: QualitiesPage });

function QualitiesPage() {
  const { qualities, addQuality, updateQuality, deleteQuality } = useStore();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [ded, setDed] = useState("1");

  function reset() { setName(""); setRate(""); setDed("1"); setEditId(null); }
  function openEdit(id: string) {
    const q = qualities.find((x) => x.id === id); if (!q) return;
    setEditId(id); setName(q.name); setRate(String(q.ratePerPiece)); setDed(String(q.deduction)); setOpen(true);
  }
  function save() {
    const r = parseFloat(rate); const d = parseFloat(ded);
    if (!name.trim() || isNaN(r) || isNaN(d)) return;
    if (editId) updateQuality(editId, { name: name.trim(), ratePerPiece: r, deduction: d });
    else addQuality({ name: name.trim(), ratePerPiece: r, deduction: d });
    reset(); setOpen(false);
  }

  return (
    <AppShell
      title="Fabric qualities"
      actions={
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild><Button>+ New quality</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Edit quality" : "Add quality"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Quality name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cotton 60s" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Rate per piece (₹)</Label><Input type="number" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} /></div>
                <div><Label>Weekly deduction (₹)</Label><Input type="number" step="0.5" value={ded} onChange={(e) => setDed(e.target.value)} /></div>
              </div>
              <p className="text-xs text-muted-foreground">Weekly payout per piece = rate − deduction. Full rate is used to compute the ledger balance owed.</p>
            </div>
            <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      {qualities.length === 0 ? (
        <EmptyState title="No qualities defined" hint="Add fabric qualities with their piece rate and weekly deduction (usually ₹0.50 or ₹1)." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Quality</th>
                <th className="px-4 py-3 text-right font-medium">Rate / piece</th>
                <th className="px-4 py-3 text-right font-medium">Deduction</th>
                <th className="px-4 py-3 text-right font-medium">Weekly payout / piece</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {qualities.map((q) => (
                <tr key={q.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{q.name}</td>
                  <td className="px-4 py-3 text-right">{inr(q.ratePerPiece)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{inr(q.deduction)}</td>
                  <td className="px-4 py-3 text-right font-medium text-success">{inr(Math.max(0, q.ratePerPiece - q.deduction))}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(q.id)}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => { if (confirm(`Delete ${q.name}?`)) deleteQuality(q.id); }}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
