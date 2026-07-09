import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Beam,
  Jobworker,
  LedgerEntry,
  Machine,
  Quality,
  Settings,
  Submission,
} from "./types";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

interface State {
  hydrated: boolean;
  jobworkers: Jobworker[];
  machines: Machine[];
  qualities: Quality[];
  beams: Beam[];
  submissions: Submission[];
  ledger: LedgerEntry[];
  settings: Settings;

  markHydrated: () => void;
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

  resetAll: () => void;
  seedDemo: () => void;
  importJson: (data: unknown) => { ok: true } | { ok: false; error: string };
}

const defaultSettings: Settings = { defaultBeamPrepCharge: 200, factoryName: "My Factory" };

const emptyState = {
  jobworkers: [] as Jobworker[],
  machines: [] as Machine[],
  qualities: [] as Quality[],
  beams: [] as Beam[],
  submissions: [] as Submission[],
  ledger: [] as LedgerEntry[],
  settings: defaultSettings,
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      hydrated: false,
      ...emptyState,

      markHydrated: () => set({ hydrated: true }),
      reset: () => set({ ...emptyState }),

      addJobworker: (data) =>
        set((s) => ({ jobworkers: [...s.jobworkers, { ...data, id: uid(), createdAt: new Date().toISOString() }] })),
      updateJobworker: (id, data) =>
        set((s) => ({ jobworkers: s.jobworkers.map((j) => (j.id === id ? { ...j, ...data } : j)) })),
      deleteJobworker: (id) =>
        set((s) => ({
          jobworkers: s.jobworkers.filter((j) => j.id !== id),
          machines: s.machines.filter((m) => m.jobworkerId !== id),
          beams: s.beams.filter((b) => b.jobworkerId !== id),
          submissions: s.submissions.filter((sub) => sub.jobworkerId !== id),
          ledger: s.ledger.filter((l) => l.jobworkerId !== id),
        })),

      addMachine: (data) =>
        set((s) => ({ machines: [...s.machines, { ...data, id: uid(), createdAt: new Date().toISOString() }] })),
      addMachinesBulk: (jobworkerId, count, prefix) => {
        const existing = get().machines.filter((m) => m.jobworkerId === jobworkerId).length;
        const now = new Date().toISOString();
        const newOnes: Machine[] = [];
        for (let i = 1; i <= count; i++) {
          const n = existing + i;
          newOnes.push({ id: uid(), jobworkerId, label: `${prefix}${String(n).padStart(2, "0")}`, createdAt: now });
        }
        set((s) => ({ machines: [...s.machines, ...newOnes] }));
      },
      updateMachine: (id, data) =>
        set((s) => ({ machines: s.machines.map((m) => (m.id === id ? { ...m, ...data } : m)) })),
      deleteMachine: (id) =>
        set((s) => ({
          machines: s.machines.filter((m) => m.id !== id),
          beams: s.beams.filter((b) => b.machineId !== id),
          submissions: s.submissions.filter((sub) => sub.machineId !== id),
        })),

      addQuality: (data) => set((s) => ({ qualities: [...s.qualities, { ...data, id: uid() }] })),
      updateQuality: (id, data) =>
        set((s) => ({ qualities: s.qualities.map((q) => (q.id === id ? { ...q, ...data } : q)) })),
      deleteQuality: (id) => set((s) => ({ qualities: s.qualities.filter((q) => q.id !== id) })),

      addBeam: (data) =>
        set((s) => ({ beams: [...s.beams, { ...data, id: uid(), closed: false }] })),
      updateBeam: (id, data) =>
        set((s) => ({ beams: s.beams.map((b) => (b.id === id ? { ...b, ...data } : b)) })),
      closeBeam: (id) => {
        const closedDate = new Date().toISOString();
        set((s) => ({ beams: s.beams.map((b) => (b.id === id ? { ...b, closed: true, closedDate } : b)) }));
      },
      reopenBeam: (id) =>
        set((s) => ({ beams: s.beams.map((b) => (b.id === id ? { ...b, closed: false, closedDate: undefined } : b)) })),
      deleteBeam: (id) =>
        set((s) => ({
          beams: s.beams.filter((b) => b.id !== id),
          submissions: s.submissions.filter((sub) => sub.beamId !== id),
        })),

      addSubmission: (data) =>
        set((s) => ({ submissions: [...s.submissions, { ...data, id: uid(), createdAt: new Date().toISOString() }] })),
      updateSubmission: (id, data) =>
        set((s) => ({ submissions: s.submissions.map((sub) => (sub.id === id ? { ...sub, ...data } : sub)) })),
      deleteSubmission: (id) =>
        set((s) => ({ submissions: s.submissions.filter((sub) => sub.id !== id) })),

      addLedger: (data) => set((s) => ({ ledger: [...s.ledger, { ...data, id: uid() }] })),
      deleteLedger: (id) => set((s) => ({ ledger: s.ledger.filter((l) => l.id !== id) })),

      updateSettings: (data) => set((s) => ({ settings: { ...s.settings, ...data } })),

      resetAll: () => set({ ...emptyState }),

      seedDemo: () => {
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
        set((s) => ({
          jobworkers: [...s.jobworkers, jw],
          machines: [...s.machines, ...machines],
          qualities: [...s.qualities, ...qualities],
        }));
      },

      importJson: (data) => {
        try {
          const src: any = (data as any)?.state ?? data;
          set({
            jobworkers: src.jobworkers ?? [],
            machines: src.machines ?? [],
            qualities: src.qualities ?? [],
            beams: src.beams ?? [],
            submissions: src.submissions ?? [],
            ledger: src.ledger ?? [],
            settings: src.settings ?? defaultSettings,
          });
          return { ok: true };
        } catch (e: any) {
          return { ok: false, error: e?.message || String(e) };
        }
      },
    }),
    {
      name: "loom-ledger-v1",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : (undefined as any)
      ),
      partialize: (s) => ({
        jobworkers: s.jobworkers,
        machines: s.machines,
        qualities: s.qualities,
        beams: s.beams,
        submissions: s.submissions,
        ledger: s.ledger,
        settings: s.settings,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    }
  )
);
