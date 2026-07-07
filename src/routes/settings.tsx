import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const { settings, updateSettings, resetAll, seedDemo, jobworkers, machines, beams, submissions, ledger, qualities } = useStore();
  const [factoryName, setFactoryName] = useState(settings.factoryName);
  const [prep, setPrep] = useState(String(settings.defaultBeamPrepCharge));

  function save() {
    updateSettings({ factoryName: factoryName.trim() || "My Factory", defaultBeamPrepCharge: parseFloat(prep) || 0 });
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

  function importJson(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (!confirm("Replace all current data with the imported file?")) return;
        useStore.setState({
          jobworkers: data.jobworkers || [], machines: data.machines || [], beams: data.beams || [],
          submissions: data.submissions || [], ledger: data.ledger || [], qualities: data.qualities || [],
          settings: data.settings || settings,
        });
      } catch { alert("Invalid file"); }
    };
    reader.readAsText(f);
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
          <p className="mt-1 text-sm text-muted-foreground">All data lives in this browser. Export regularly, and import to restore or move to another device.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportJson}>Export JSON</Button>
            <label className="inline-flex cursor-pointer items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
              Import JSON
              <input type="file" accept="application/json" className="hidden" onChange={importJson} />
            </label>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">Danger zone</h2>
          <p className="mt-1 text-sm text-muted-foreground">Load sample data to explore the app, or wipe everything and start fresh.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={seedDemo}>Load demo data</Button>
            <Button variant="destructive" onClick={() => { if (confirm("Delete ALL data? This cannot be undone.")) resetAll(); }}>Reset everything</Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
