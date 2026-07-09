import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/settings")({ component: SettingsPage });

function SettingsPage() {
  const { settings, updateSettings, resetAll, seedDemo, importJson, jobworkers, machines, beams, submissions, ledger, qualities } = useStore();
  const [factoryName, setFactoryName] = useState(settings.factoryName);
  const [prep, setPrep] = useState(String(settings.defaultBeamPrepCharge));
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function save() {
    updateSettings({ factoryName: factoryName.trim() || "My Factory", defaultBeamPrepCharge: parseFloat(prep) || 0 });
  }

  function exportJson() {
    const blob = new Blob(
      [JSON.stringify({ jobworkers, machines, beams, submissions, ledger, qualities, settings }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `loom-ledger-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm("Import this backup? Existing data on this device will be replaced.")) {
      e.target.value = "";
      return;
    }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = importJson(parsed);
      setImportMsg(res.ok ? "Import complete." : `Import failed: ${res.error}`);
    } catch (err: any) {
      setImportMsg(`Import failed: ${err?.message || String(err)}`);
    } finally {
      e.target.value = "";
    }
  }

  return (
    <AppShell title="Settings">
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
          <h2 className="font-display text-lg font-semibold">Backup & restore</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            All data is stored on this device only. Export regularly to keep a copy safe.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={exportJson}>Export JSON</Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>Import JSON</Button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImportFile} />
            {importMsg && <span className="text-sm text-muted-foreground">{importMsg}</span>}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">Danger zone</h2>
          <p className="mt-1 text-sm text-muted-foreground">Load sample data to explore the app, or wipe everything and start fresh.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => seedDemo()}>Load demo data</Button>
            <Button variant="destructive" onClick={() => { if (confirm("Delete ALL data on this device? This cannot be undone.")) resetAll(); }}>Reset everything</Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
