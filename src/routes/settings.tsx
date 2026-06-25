import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Download, Upload, RotateCcw, Smartphone } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useHabits } from "@/lib/habits/store";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Loop" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const exportData = useHabits((s) => s.exportData);
  const importData = useHabits((s) => s.importData);
  const reset = useHabits((s) => s.reset);
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const doExport = () => {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `loop-habits-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = async (file: File) => {
    try {
      const text = await file.text();
      importData(text);
      setMsg("Imported.");
    } catch {
      setMsg("Invalid file.");
    }
  };

  return (
    <AppShell>
      <header className="px-5 pt-10 pb-6">
        <h1 className="font-display text-4xl font-bold tracking-tight">Settings</h1>
      </header>

      <div className="space-y-3 px-5">
        <Row
          icon={<Smartphone size={18} />}
          title="Add to home screen"
          desc="In Chrome: menu → Install app, or Add to Home screen. Long-press the Loop icon for a Widget shortcut."
        />
        <Action icon={<Download size={18} />} label="Export data" onClick={doExport} />
        <Action
          icon={<Upload size={18} />}
          label="Import data"
          onClick={() => fileRef.current?.click()}
        />
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) doImport(f);
            e.target.value = "";
          }}
        />
        <Action
          icon={<RotateCcw size={18} />}
          label="Reset all data"
          onClick={() => {
            if (confirm("Delete all habits and history? This cannot be undone.")) {
              reset();
              setMsg("Reset.");
            }
          }}
          danger
        />
        {msg && <p className="pt-2 text-center text-xs text-muted-foreground">{msg}</p>}

        <p className="pt-10 text-center text-xs text-muted-foreground">
          Loop · offline-first habit tracker
        </p>
      </div>
    </AppShell>
  );
}

function Row({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl bg-card p-4">
      <div className="mt-0.5 text-primary">{icon}</div>
      <div>
        <div className="font-medium">{title}</div>
        <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function Action({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left"
      style={{ color: danger ? "var(--destructive)" : undefined }}
    >
      <span>{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );
}