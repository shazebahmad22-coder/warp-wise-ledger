import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({ component: SettingsPage });

function SettingsPage() {
  const router = useRouter();
  const { settings, updateSettings, resetAll, seedDemo, importFromLocal, jobworkers, machines, beams, submissions, ledger, qualities } = useStore();
  const [factoryName, setFactoryName] = useState(settings.factoryName);
  const [prep, setPrep] = useState(String(settings.defaultBeamPrepCharge));
  const [importState, setImportState] = useState<{ loading: boolean; msg?: string; err?: string }>({ loading: false });

  function save() {
    updateSettings({ factoryName: factoryName.trim() || "My Factory", defaultBeamPrepCharge: parseFloat(prep) || 0 });
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth" });
  }

  async function runImport() {
    if (!confirm("Import factory data saved in THIS browser into the cloud? Existing rows with the same IDs will be overwritten.")) return;
    setImportState({ loading: true });
    const res = await importFromLocal();
    if (res.ok) {
      const c = res.counts;
      setImportState({ loading: false, msg: `Imported: ${c.jobworkers} jobworkers, ${c.machines} machines, ${c.qualities} qualities, ${c.beams} beams, ${c.submissions} submissions, ${c.ledger} ledger entries.` });
    } else {
      setImportState({ loading: false, err: res.error });
    }
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify({ jobworkers, machines, beams, submissions, ledger, qualities, settings }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `loom-ledger-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell title="Settings" actions={<Button variant="outline" onClick={signOut}>Sign out</Button>}>
      <div className="max-w-2xl space-y-6">
        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">Factory</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><Label>Factory name</Label><Input value={factoryName} onChange={(e) => setFactoryName(e.target.value)} /></div>
            <div><Label>Default beam prep charge (₹)</Label><Input type="number" value={prep} onChange={(e) => setPrep(e.target.value)} /></div>
          </div>
          <Button className="mt-4" onClick={save}>Save</Button>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">Import from this browser</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            If you used Loom Ledger on this device before switching to logins, you can push that local data into the cloud once. It will then be shared with all staff logins.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={runImport} disabled={importState.loading}>
              {importState.loading ? "Importing…" : "Import local data"}
            </Button>
            {importState.msg && <span className="text-sm text-success">{importState.msg}</span>}
            {importState.err && <span className="text-sm text-destructive">{importState.err}</span>}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">Backup</h2>
          <p className="mt-1 text-sm text-muted-foreground">Download a JSON snapshot of the current cloud data.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportJson}>Export JSON</Button>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">Danger zone</h2>
          <p className="mt-1 text-sm text-muted-foreground">Load sample data to explore the app, or wipe everything and start fresh. Actions affect all logins.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => seedDemo()}>Load demo data</Button>
            <Button variant="destructive" onClick={() => { if (confirm("Delete ALL cloud data? This cannot be undone.")) resetAll(); }}>Reset everything</Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
