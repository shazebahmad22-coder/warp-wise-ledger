export type ID = string;

export interface Jobworker {
  id: ID;
  name: string;
  phone?: string;
  notes?: string;
  createdAt: string;
}

export interface Machine {
  id: ID;
  jobworkerId: ID;
  label: string; // e.g. "M-01"
  createdAt: string;
}

export interface Quality {
  id: ID;
  name: string;
  ratePerPiece: number; // owed to jobworker per piece
  deduction: number; // 0.5 or 1, subtracted from rate for weekly payout
  notes?: string;
}

export interface Beam {
  id: ID;
  jobworkerId: ID;
  machineId: ID;
  beamNumber: string;
  warpWeightKg: number;
  assignedDate: string; // ISO
  prepCharge: number; // charged to jobworker for beam preparation
  closed: boolean;
  closedDate?: string;
  notes?: string;
}

export interface Submission {
  id: ID;
  weekEnding: string; // ISO date
  jobworkerId: ID;
  machineId: ID;
  beamId: ID;
  qualityId: ID;
  pieces: number;
  weightKg: number;
  createdAt: string;
}

export type LedgerType = "payment" | "advance" | "adjustment";

export interface LedgerEntry {
  id: ID;
  jobworkerId: ID;
  date: string;
  type: LedgerType;
  amount: number; // positive number; type determines direction
  note?: string;
}

export interface Settings {
  defaultBeamPrepCharge: number;
  factoryName: string;
}
