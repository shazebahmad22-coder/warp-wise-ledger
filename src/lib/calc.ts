import type { Beam, LedgerEntry, Quality, Submission } from "./types";

export function inr(n: number): string {
  if (!isFinite(n)) return "₹0";
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function kg(n: number): string {
  return `${(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })} kg`;
}

export interface BeamStats {
  pieces: number;
  weightKg: number;
  submissionCount: number;
}

export function statsForBeam(beamId: string, submissions: Submission[]): BeamStats {
  const rows = submissions.filter((s) => s.beamId === beamId);
  return {
    pieces: rows.reduce((a, r) => a + (r.pieces || 0), 0),
    weightKg: rows.reduce((a, r) => a + (r.weightKg || 0), 0),
    submissionCount: rows.length,
  };
}

export interface JobworkerBalance {
  earned: number; // total money owed to jobworker from pieces * rate
  weeklyPayout: number; // total pieces * (rate - deduction)
  advances: number;
  payments: number;
  beamCharges: number;
  adjustments: number;
  // Net balance: positive = we owe jobworker; negative = jobworker owes us
  net: number;
}

export function balanceFor(
  jobworkerId: string,
  submissions: Submission[],
  qualities: Quality[],
  beams: Beam[],
  ledger: LedgerEntry[],
): JobworkerBalance {
  const qMap = new Map(qualities.map((q) => [q.id, q]));
  const subs = submissions.filter((s) => s.jobworkerId === jobworkerId);

  let earned = 0;
  let weeklyPayout = 0;
  for (const s of subs) {
    const q = qMap.get(s.qualityId);
    if (!q) continue;
    earned += s.pieces * q.ratePerPiece;
    weeklyPayout += s.pieces * Math.max(0, q.ratePerPiece - q.deduction);
  }

  const beamCharges = beams
    .filter((b) => b.jobworkerId === jobworkerId)
    .reduce((a, b) => a + (b.prepCharge || 0), 0);

  const led = ledger.filter((l) => l.jobworkerId === jobworkerId);
  const payments = led.filter((l) => l.type === "payment").reduce((a, l) => a + l.amount, 0);
  const advances = led.filter((l) => l.type === "advance").reduce((a, l) => a + l.amount, 0);
  const adjustments = led.filter((l) => l.type === "adjustment").reduce((a, l) => a + l.amount, 0);

  const net = earned - payments - advances - beamCharges + adjustments;
  return { earned, weeklyPayout, advances, payments, beamCharges, adjustments, net };
}
