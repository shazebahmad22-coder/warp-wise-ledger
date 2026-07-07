import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { AppShell, EmptyState, Stat } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import type { LedgerType } from "@/lib/types";
import { balanceFor, inr } from "@/lib/calc";

export const Route = createFileRoute("/_authenticated/ledger")({ component: LedgerPage });

function LedgerPage() {
  const { jobworkers, machines, submissions, qualities, beams, ledger, addLedger, deleteLedger } = useStore();
  const [selected, setSelected] = useState<string>("");
  const [open, setOpen] = useState(false);

  const activeJw = jobworkers.find((j) => j.id === selected) || jobworkers[0];
  const jwId = activeJw?.id;

  const bal = useMemo(
    () => jwId ? balanceFor(jwId, submissions, qualities, beams, ledger) : null,
    [jwId, submissions, qualities, beams, ledger],
  );

  // Build merged transaction feed
  const entries = useMemo(() => {
    if (!jwId) return [];
    const q = new Map(qualities.map((x) => [x.id, x]));
    const feed: Array<{ id: string; date: string; label: string; owed: number; taken: number; note?: string; kind: string }> = [];

    for (const s of submissions.filter((x) => x.jobworkerId === jwId)) {
      const qq = q.get(s.qualityId);
      const amt = qq ? s.pieces * qq.ratePerPiece : 0;
      const mc = machines.find((m) => m.id === s.machineId);
      feed.push({
        id: `sub-${s.id}`,
        date: s.weekEnding,
        label: `Submission · ${qq?.name || ""} × ${s.pieces} pc`,
        owed: amt,
        taken: 0,
        note: mc?.label,
        kind: "sub",
      });
    }
    for (const b of beams.filter((x) => x.jobworkerId === jwId)) {
      if (b.prepCharge > 0) {
        const mc = machines.find((m) => m.id === b.machineId);
        feed.push({ id: `beam-${b.id}`, date: b.assignedDate, label: `Beam prep · ${b.beamNumber}`, owed: 0, taken: b.prepCharge, note: mc?.label, kind: "beam" });
      }
    }
    for (const l of ledger.filter((x) => x.jobworkerId === jwId)) {
      const isCredit = l.type === "adjustment" && l.amount > 0;
      feed.push({
        id: `led-${l.id}`,
        date: l.date,
        label: l.type === "payment" ? "Payment" : l.type === "advance" ? "Advance" : "Adjustment",
        owed: isCredit ? l.amount : 0,
        taken: isCredit ? 0 : l.amount,
        note: l.note,
        kind: `led-${l.type}`,
      });
    }
    return feed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [jwId, submissions, qualities, machines, beams, ledger]);

  // Add ledger dialog
  const [type, setType] = useState<LedgerType>("payment");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");

  function save() {
    if (!jwId) return;
    const a = parseFloat(amount);
    if (!isFinite(a) || a === 0) return;
    addLedger({ jobworkerId: jwId, type, amount: Math.abs(a) * (type === "adjustment" && a < 0 ? -1 : 1), date: new Date(date).toISOString(), note });
    setAmount(""); setNote(""); setOpen(false);
  }

  return (
    <AppShell
      title="Ledger"
      actions={
        <>
          {jobworkers.length > 0 && (
            <Select value={jwId} onValueChange={setSelected}>
              <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
              <SelectContent>{jobworkers.map((j) => <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button disabled={!jwId}>+ Add entry</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add ledger entry — {activeJw?.name}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Type</Label>
                    <Select value={type} onValueChange={(v) => setType(v as LedgerType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="payment">Weekly payment (to jobworker)</SelectItem>
                        <SelectItem value="advance">Advance given</SelectItem>
                        <SelectItem value="adjustment">Adjustment (use negative to charge)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
                </div>
                <div><Label>Amount (₹)</Label><Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
                <div><Label>Note</Label><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" /></div>
              </div>
              <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      }
    >
      {!activeJw ? (
        <EmptyState title="No jobworkers" hint="Add a jobworker first to keep their ledger." />
      ) : bal ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Total earned" value={inr(bal.earned)} sub="Pieces × full rate" />
            <Stat label="Weekly payout basis" value={inr(bal.weeklyPayout)} sub="Pieces × (rate − deduction)" />
            <Stat label="Paid + advances" value={inr(bal.payments + bal.advances)} sub={`${inr(bal.payments)} paid · ${inr(bal.advances)} advance`} />
            <Stat
              label="Net balance"
              value={<span className={bal.net > 0 ? "text-success" : bal.net < 0 ? "text-destructive" : ""}>{bal.net >= 0 ? inr(bal.net) : `(${inr(-bal.net)})`}</span>}
              sub={bal.net >= 0 ? "We owe jobworker" : "Jobworker owes us"}
            />
          </div>

          <div className="mt-6 rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Formula:</span> Net = Earned − Payments − Advances − Beam prep charges + Adjustments. Beam prep total for {activeJw.name}: <span className="font-medium text-foreground">{inr(bal.beamCharges)}</span>.
          </div>

          <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Entry</th>
                  <th className="px-4 py-3 text-right font-medium">Owed (+)</th>
                  <th className="px-4 py-3 text-right font-medium">Taken (−)</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No entries yet.</td></tr>
                )}
                {entries.map((e) => (
                  <tr key={e.id} className="border-t border-border">
                    <td className="px-4 py-3 text-muted-foreground">{format(new Date(e.date), "d MMM yyyy")}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{e.label}</div>
                      {e.note && <div className="text-xs text-muted-foreground">{e.note}</div>}
                    </td>
                    <td className="px-4 py-3 text-right text-success">{e.owed > 0 ? inr(e.owed) : ""}</td>
                    <td className="px-4 py-3 text-right text-destructive">{e.taken > 0 ? inr(e.taken) : ""}</td>
                    <td className="px-4 py-3 text-right">
                      {e.kind.startsWith("led-") && (
                        <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this entry?")) deleteLedger(e.id.replace("led-", "")); }}>×</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </AppShell>
  );
}
