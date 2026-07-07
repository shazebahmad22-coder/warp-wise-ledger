import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type {
  Beam,
  Jobworker,
  LedgerEntry,
  LedgerType,
  Machine,
  Quality,
  Settings,
  Submission,
} from "./types";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// --- DB row <-> app object mappers -----------------------------------------

const mapJw = (r: any): Jobworker => ({ id: r.id, name: r.name, phone: r.phone ?? undefined, notes: r.notes ?? undefined, createdAt: r.created_at });
const jwRow = (j: Jobworker) => ({ id: j.id, name: j.name, phone: j.phone ?? null, notes: j.notes ?? null, created_at: j.createdAt });

const mapMachine = (r: any): Machine => ({ id: r.id, jobworkerId: r.jobworker_id, label: r.label, createdAt: r.created_at });
const machineRow = (m: Machine) => ({ id: m.id, jobworker_id: m.jobworkerId, label: m.label, created_at: m.createdAt });

const mapQuality = (r: any): Quality => ({ id: r.id, name: r.name, ratePerPiece: Number(r.rate_per_piece), deduction: Number(r.deduction), notes: r.notes ?? undefined });
const qualityRow = (q: Quality) => ({ id: q.id, name: q.name, rate_per_piece: q.ratePerPiece, deduction: q.deduction, notes: q.notes ?? null });

const mapBeam = (r: any): Beam => ({
  id: r.id, jobworkerId: r.jobworker_id, machineId: r.machine_id, beamNumber: r.beam_number,
  warpWeightKg: Number(r.warp_weight_kg), assignedDate: r.assigned_date, prepCharge: Number(r.prep_charge),
  closed: !!r.closed, closedDate: r.closed_date ?? undefined, notes: r.notes ?? undefined,
});
const beamRow = (b: Beam) => ({
  id: b.id, jobworker_id: b.jobworkerId, machine_id: b.machineId, beam_number: b.beamNumber,
  warp_weight_kg: b.warpWeightKg, assigned_date: b.assignedDate, prep_charge: b.prepCharge,
  closed: b.closed, closed_date: b.closedDate ?? null, notes: b.notes ?? null,
});

const mapSub = (r: any): Submission => ({
  id: r.id, weekEnding: r.week_ending, jobworkerId: r.jobworker_id, machineId: r.machine_id,
  beamId: r.beam_id, qualityId: r.quality_id, pieces: Number(r.pieces), weightKg: Number(r.weight_kg), createdAt: r.created_at,
});
const subRow = (s: Submission) => ({
  id: s.id, week_ending: s.weekEnding, jobworker_id: s.jobworkerId, machine_id: s.machineId,
  beam_id: s.beamId, quality_id: s.qualityId, pieces: s.pieces, weight_kg: s.weightKg, created_at: s.createdAt,
});

const mapLedger = (r: any): LedgerEntry => ({ id: r.id, jobworkerId: r.jobworker_id, date: r.date, type: r.type as LedgerType, amount: Number(r.amount), note: r.note ?? undefined });
const ledgerRow = (l: LedgerEntry) => ({ id: l.id, jobworker_id: l.jobworkerId, date: l.date, type: l.type, amount: l.amount, note: l.note ?? null });

// --- Store ------------------------------------------------------------------

interface State {
  hydrated: boolean;
  jobworkers: Jobworker[];
  machines: Machine[];
  qualities: Quality[];
  beams: Beam[];
  submissions: Submission[];
  ledger: LedgerEntry[];
  settings: Settings;

  hydrate: () => Promise<void>;
  reset: () => void;

  addJobworker: (data: Omit<Jobworker, "id" | "createdAt">) => void;
  updateJobworker: (id: string, data: Partial<Jobworker>) => void;
  deleteJobworker: (id: string) => void;

  addMachine: (data: Omit<Machine, "id" | "createdAt">) => void;
  addMachinesBulk: (jobworkerId: string, count: number, prefix: string) => void;
  updateMachine: (id: string, data: Partial<Machine>) => void;
  deleteMachine: (id: string) => void;

  addQuality: (data: Omit<Quality, "id">) => void;
  updateQuality: (id: string, data: Partial<Quality>) => void;
  deleteQuality: (id: string) => void;

  addBeam: (data: Omit<Beam, "id" | "closed">) => void;
  updateBeam: (id: string, data: Partial<Beam>) => void;
  closeBeam: (id: string) => void;
  reopenBeam: (id: string) => void;
  deleteBeam: (id: string) => void;

  addSubmission: (data: Omit<Submission, "id" | "createdAt">) => void;
  updateSubmission: (id: string, data: Partial<Submission>) => void;
  deleteSubmission: (id: string) => void;

  addLedger: (data: Omit<LedgerEntry, "id">) => void;
  deleteLedger: (id: string) => void;

  updateSettings: (data: Partial<Settings>) => void;

  resetAll: () => Promise<void>;
  seedDemo: () => Promise<void>;
  importFromLocal: () => Promise<{ ok: true; counts: Record<string, number> } | { ok: false; error: string }>;
}

const defaultSettings: Settings = { defaultBeamPrepCharge: 200, factoryName: "My Factory" };

function reportErr(where: string, err: any) {
  if (err) console.error(`[store] ${where}:`, err.message || err);
}

export const useStore = create<State>()((set, get) => ({
  hydrated: false,
  jobworkers: [],
  machines: [],
  qualities: [],
  beams: [],
  submissions: [],
  ledger: [],
  settings: defaultSettings,

  reset: () => set({ hydrated: false, jobworkers: [], machines: [], qualities: [], beams: [], submissions: [], ledger: [], settings: defaultSettings }),

  async hydrate() {
    const [jw, mc, ql, bm, sb, lg, st] = await Promise.all([
      supabase.from("jobworkers").select("*").order("created_at"),
      supabase.from("machines").select("*").order("created_at"),
      supabase.from("qualities").select("*"),
      supabase.from("beams").select("*").order("assigned_date"),
      supabase.from("submissions").select("*").order("week_ending", { ascending: false }),
      supabase.from("ledger").select("*").order("date", { ascending: false }),
      supabase.from("app_settings").select("*").eq("id", 1).maybeSingle(),
    ]);
    reportErr("hydrate jobworkers", jw.error);
    reportErr("hydrate machines", mc.error);
    reportErr("hydrate qualities", ql.error);
    reportErr("hydrate beams", bm.error);
    reportErr("hydrate submissions", sb.error);
    reportErr("hydrate ledger", lg.error);
    reportErr("hydrate settings", st.error);
    set({
      hydrated: true,
      jobworkers: (jw.data ?? []).map(mapJw),
      machines: (mc.data ?? []).map(mapMachine),
      qualities: (ql.data ?? []).map(mapQuality),
      beams: (bm.data ?? []).map(mapBeam),
      submissions: (sb.data ?? []).map(mapSub),
      ledger: (lg.data ?? []).map(mapLedger),
      settings: st.data
        ? { factoryName: st.data.factory_name, defaultBeamPrepCharge: Number(st.data.default_beam_prep_charge) }
        : defaultSettings,
    });
  },

  addJobworker(data) {
    const j: Jobworker = { ...data, id: uid(), createdAt: new Date().toISOString() };
    set((s) => ({ jobworkers: [...s.jobworkers, j] }));
    supabase.from("jobworkers").insert(jwRow(j)).then(({ error }) => reportErr("addJobworker", error));
  },
  updateJobworker(id, data) {
    set((s) => ({ jobworkers: s.jobworkers.map((j) => (j.id === id ? { ...j, ...data } : j)) }));
    const next = get().jobworkers.find((j) => j.id === id);
    if (next) supabase.from("jobworkers").update(jwRow(next)).eq("id", id).then(({ error }) => reportErr("updateJobworker", error));
  },
  deleteJobworker(id) {
    set((s) => ({
      jobworkers: s.jobworkers.filter((j) => j.id !== id),
      machines: s.machines.filter((m) => m.jobworkerId !== id),
      beams: s.beams.filter((b) => b.jobworkerId !== id),
      submissions: s.submissions.filter((sub) => sub.jobworkerId !== id),
      ledger: s.ledger.filter((l) => l.jobworkerId !== id),
    }));
    supabase.from("jobworkers").delete().eq("id", id).then(({ error }) => reportErr("deleteJobworker", error));
  },

  addMachine(data) {
    const m: Machine = { ...data, id: uid(), createdAt: new Date().toISOString() };
    set((s) => ({ machines: [...s.machines, m] }));
    supabase.from("machines").insert(machineRow(m)).then(({ error }) => reportErr("addMachine", error));
  },
  addMachinesBulk(jobworkerId, count, prefix) {
    const existing = get().machines.filter((m) => m.jobworkerId === jobworkerId).length;
    const now = new Date().toISOString();
    const newOnes: Machine[] = [];
    for (let i = 1; i <= count; i++) {
      const n = existing + i;
      newOnes.push({ id: uid(), jobworkerId, label: `${prefix}${String(n).padStart(2, "0")}`, createdAt: now });
    }
    set((s) => ({ machines: [...s.machines, ...newOnes] }));
    supabase.from("machines").insert(newOnes.map(machineRow)).then(({ error }) => reportErr("addMachinesBulk", error));
  },
  updateMachine(id, data) {
    set((s) => ({ machines: s.machines.map((m) => (m.id === id ? { ...m, ...data } : m)) }));
    const next = get().machines.find((m) => m.id === id);
    if (next) supabase.from("machines").update(machineRow(next)).eq("id", id).then(({ error }) => reportErr("updateMachine", error));
  },
  deleteMachine(id) {
    set((s) => ({
      machines: s.machines.filter((m) => m.id !== id),
      beams: s.beams.filter((b) => b.machineId !== id),
      submissions: s.submissions.filter((sub) => sub.machineId !== id),
    }));
    supabase.from("machines").delete().eq("id", id).then(({ error }) => reportErr("deleteMachine", error));
  },

  addQuality(data) {
    const q: Quality = { ...data, id: uid() };
    set((s) => ({ qualities: [...s.qualities, q] }));
    supabase.from("qualities").insert(qualityRow(q)).then(({ error }) => reportErr("addQuality", error));
  },
  updateQuality(id, data) {
    set((s) => ({ qualities: s.qualities.map((q) => (q.id === id ? { ...q, ...data } : q)) }));
    const next = get().qualities.find((q) => q.id === id);
    if (next) supabase.from("qualities").update(qualityRow(next)).eq("id", id).then(({ error }) => reportErr("updateQuality", error));
  },
  deleteQuality(id) {
    set((s) => ({ qualities: s.qualities.filter((q) => q.id !== id) }));
    supabase.from("qualities").delete().eq("id", id).then(({ error }) => reportErr("deleteQuality", error));
  },

  addBeam(data) {
    const b: Beam = { ...data, id: uid(), closed: false };
    set((s) => ({ beams: [...s.beams, b] }));
    supabase.from("beams").insert(beamRow(b)).then(({ error }) => reportErr("addBeam", error));
  },
  updateBeam(id, data) {
    set((s) => ({ beams: s.beams.map((b) => (b.id === id ? { ...b, ...data } : b)) }));
    const next = get().beams.find((b) => b.id === id);
    if (next) supabase.from("beams").update(beamRow(next)).eq("id", id).then(({ error }) => reportErr("updateBeam", error));
  },
  closeBeam(id) {
    const closedDate = new Date().toISOString();
    set((s) => ({ beams: s.beams.map((b) => (b.id === id ? { ...b, closed: true, closedDate } : b)) }));
    supabase.from("beams").update({ closed: true, closed_date: closedDate }).eq("id", id).then(({ error }) => reportErr("closeBeam", error));
  },
  reopenBeam(id) {
    set((s) => ({ beams: s.beams.map((b) => (b.id === id ? { ...b, closed: false, closedDate: undefined } : b)) }));
    supabase.from("beams").update({ closed: false, closed_date: null }).eq("id", id).then(({ error }) => reportErr("reopenBeam", error));
  },
  deleteBeam(id) {
    set((s) => ({
      beams: s.beams.filter((b) => b.id !== id),
      submissions: s.submissions.filter((sub) => sub.beamId !== id),
    }));
    supabase.from("beams").delete().eq("id", id).then(({ error }) => reportErr("deleteBeam", error));
  },

  addSubmission(data) {
    const sub: Submission = { ...data, id: uid(), createdAt: new Date().toISOString() };
    set((s) => ({ submissions: [...s.submissions, sub] }));
    supabase.from("submissions").insert(subRow(sub)).then(({ error }) => reportErr("addSubmission", error));
  },
  updateSubmission(id, data) {
    set((s) => ({ submissions: s.submissions.map((sub) => (sub.id === id ? { ...sub, ...data } : sub)) }));
    const next = get().submissions.find((s) => s.id === id);
    if (next) supabase.from("submissions").update(subRow(next)).eq("id", id).then(({ error }) => reportErr("updateSubmission", error));
  },
  deleteSubmission(id) {
    set((s) => ({ submissions: s.submissions.filter((sub) => sub.id !== id) }));
    supabase.from("submissions").delete().eq("id", id).then(({ error }) => reportErr("deleteSubmission", error));
  },

  addLedger(data) {
    const l: LedgerEntry = { ...data, id: uid() };
    set((s) => ({ ledger: [...s.ledger, l] }));
    supabase.from("ledger").insert(ledgerRow(l)).then(({ error }) => reportErr("addLedger", error));
  },
  deleteLedger(id) {
    set((s) => ({ ledger: s.ledger.filter((l) => l.id !== id) }));
    supabase.from("ledger").delete().eq("id", id).then(({ error }) => reportErr("deleteLedger", error));
  },

  updateSettings(data) {
    set((s) => ({ settings: { ...s.settings, ...data } }));
    const next = get().settings;
    supabase
      .from("app_settings")
      .upsert({ id: 1, factory_name: next.factoryName, default_beam_prep_charge: next.defaultBeamPrepCharge })
      .then(({ error }) => reportErr("updateSettings", error));
  },

  async resetAll() {
    // Delete rows in dependency-safe order
    await supabase.from("ledger").delete().neq("id", "");
    await supabase.from("submissions").delete().neq("id", "");
    await supabase.from("beams").delete().neq("id", "");
    await supabase.from("qualities").delete().neq("id", "");
    await supabase.from("machines").delete().neq("id", "");
    await supabase.from("jobworkers").delete().neq("id", "");
    set({ jobworkers: [], machines: [], qualities: [], beams: [], submissions: [], ledger: [] });
  },

  async seedDemo() {
    if (get().jobworkers.length > 0) return;
    const now = new Date().toISOString();
    const jwId = uid();
    const jw: Jobworker = { id: jwId, name: "Ramesh Patel", phone: "98xxxxxx01", createdAt: now };
    const machines: Machine[] = Array.from({ length: 8 }, (_, i) => ({
      id: uid(), jobworkerId: jwId, label: `M-${String(i + 1).padStart(2, "0")}`, createdAt: now,
    }));
    const qualities: Quality[] = [
      { id: uid(), name: "Cotton 60s", ratePerPiece: 12, deduction: 1 },
      { id: uid(), name: "Poly Blend 40s", ratePerPiece: 9, deduction: 0.5 },
    ];
    set((s) => ({ jobworkers: [...s.jobworkers, jw], machines: [...s.machines, ...machines], qualities: [...s.qualities, ...qualities] }));
    await supabase.from("jobworkers").insert(jwRow(jw));
    await supabase.from("machines").insert(machines.map(machineRow));
    await supabase.from("qualities").insert(qualities.map(qualityRow));
  },

  async importFromLocal() {
    try {
      if (typeof window === "undefined") return { ok: false, error: "No browser storage" };
      const raw = localStorage.getItem("factory-ledger-v1");
      if (!raw) return { ok: false, error: "No local data found in this browser" };
      const parsed = JSON.parse(raw);
      const src = parsed?.state ?? parsed; // zustand persist wraps in {state,version}
      const jws: Jobworker[] = src.jobworkers ?? [];
      const mcs: Machine[] = src.machines ?? [];
      const qls: Quality[] = src.qualities ?? [];
      const bms: Beam[] = src.beams ?? [];
      const sbs: Submission[] = src.submissions ?? [];
      const lgs: LedgerEntry[] = src.ledger ?? [];
      const settings: Settings | undefined = src.settings;

      if (jws.length) { const { error } = await supabase.from("jobworkers").upsert(jws.map(jwRow)); if (error) throw error; }
      if (mcs.length) { const { error } = await supabase.from("machines").upsert(mcs.map(machineRow)); if (error) throw error; }
      if (qls.length) { const { error } = await supabase.from("qualities").upsert(qls.map(qualityRow)); if (error) throw error; }
      if (bms.length) { const { error } = await supabase.from("beams").upsert(bms.map(beamRow)); if (error) throw error; }
      if (sbs.length) { const { error } = await supabase.from("submissions").upsert(sbs.map(subRow)); if (error) throw error; }
      if (lgs.length) { const { error } = await supabase.from("ledger").upsert(lgs.map(ledgerRow)); if (error) throw error; }
      if (settings) {
        await supabase.from("app_settings").upsert({ id: 1, factory_name: settings.factoryName, default_beam_prep_charge: settings.defaultBeamPrepCharge });
      }
      await get().hydrate();
      return { ok: true, counts: { jobworkers: jws.length, machines: mcs.length, qualities: qls.length, beams: bms.length, submissions: sbs.length, ledger: lgs.length } };
    } catch (e: any) {
      return { ok: false, error: e?.message || String(e) };
    }
  },
}));
