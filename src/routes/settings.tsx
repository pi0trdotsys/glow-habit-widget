import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Download, Upload, RotateCcw, Smartphone, Bell, User, CalendarCheck, Flame } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useHabits } from "@/lib/habits/store";
import {
  getPermissionState,
  requestNotificationPermission,
  type PermissionState,
} from "@/lib/notifications";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings - Loop" }] }),
  component: SettingsPage,
});

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function SettingsPage() {
  const exportData = useHabits((s) => s.exportData);
  const importData = useHabits((s) => s.importData);
  const reset = useHabits((s) => s.reset);
  const userName = useHabits((s) => s.userName);
  const setUserName = useHabits((s) => s.setUserName);
  const notif = useHabits((s) => s.notifications);
  const setNotifications = useHabits((s) => s.setNotifications);
  const [nameDraft, setNameDraft] = useState(userName ?? "");
  useEffect(() => setNameDraft(userName ?? ""), [userName]);

  const [permission, setPermission] = useState<PermissionState>("default");

  useEffect(() => {
    void getPermissionState().then(setPermission);
  }, []);

  // Turning any reminder on needs permission first; grab it lazily.
  const ensurePermission = async (): Promise<boolean> => {
    let p = permission;
    if (p !== "granted") {
      p = await requestNotificationPermission();
      setPermission(p);
    }
    if (p !== "granted") setMsg("Notifications were not allowed.");
    return p === "granted";
  };

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
        <div className="rounded-2xl bg-card p-4">
          <div className="flex items-center gap-3">
            <User size={18} className="text-primary" />
            <span className="font-medium">Your name</span>
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              maxLength={24}
              placeholder="Your name"
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              onClick={() => {
                setUserName(nameDraft);
                setMsg("Saved.");
              }}
              className="rounded-xl px-4 text-sm font-medium"
              style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              Save
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-primary" />
              <span className="font-medium">Daily reminder</span>
            </div>
            <Toggle
              checked={notif.enabled}
              disabled={permission === "unsupported"}
              onChange={async (on) => {
                if (on) {
                  if (await ensurePermission()) {
                    setNotifications({ ...notif, enabled: true });
                  }
                } else {
                  setNotifications({ ...notif, enabled: false });
                }
              }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Reminder time</span>
            <input
              type="time"
              value={notif.time}
              onChange={(e) => setNotifications({ ...notif, time: e.target.value })}
              disabled={!notif.enabled}
              className="rounded-xl border border-border bg-background px-3 py-1.5 text-sm outline-none disabled:opacity-50"
            />
          </div>
          {permission === "denied" && (
            <p className="mt-2 text-[11px] text-destructive">
              Notifications are blocked. Enable them in your system settings.
            </p>
          )}
          {permission === "unsupported" && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Your browser doesn't support notifications.
            </p>
          )}
          <p className="mt-2 text-[11px] text-muted-foreground">
            Set a per-habit time on each habit's page for task-specific reminders.
          </p>
        </div>

        <div className="rounded-2xl bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarCheck size={18} className="text-primary" />
              <span className="font-medium">Weekly recap</span>
            </div>
            <Toggle
              checked={notif.weeklyReport}
              disabled={permission === "unsupported"}
              onChange={async (on) => {
                if (on) {
                  if (await ensurePermission()) {
                    setNotifications({ ...notif, weeklyReport: true });
                  }
                } else {
                  setNotifications({ ...notif, weeklyReport: false });
                }
              }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Day &amp; time</span>
            <div className="flex gap-2">
              <select
                value={notif.reportDay}
                onChange={(e) =>
                  setNotifications({ ...notif, reportDay: Number(e.target.value) })
                }
                disabled={!notif.weeklyReport}
                className="rounded-xl border border-border bg-background px-2 py-1.5 text-sm outline-none disabled:opacity-50"
              >
                {DAY_NAMES.map((d, i) => (
                  <option key={i} value={i}>
                    {d}
                  </option>
                ))}
              </select>
              <input
                type="time"
                value={notif.reportTime}
                onChange={(e) =>
                  setNotifications({ ...notif, reportTime: e.target.value })
                }
                disabled={!notif.weeklyReport}
                className="rounded-xl border border-border bg-background px-3 py-1.5 text-sm outline-none disabled:opacity-50"
              />
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            A weekly nudge to compare this week's habits against last week.
          </p>
        </div>

        <div className="rounded-2xl bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Flame size={18} className="text-primary" />
              <span className="font-medium">Motivational boosts</span>
            </div>
            <Toggle
              checked={notif.boosts}
              disabled={permission === "unsupported"}
              onChange={async (on) => {
                if (on) {
                  if (await ensurePermission()) {
                    setNotifications({ ...notif, boosts: true });
                  }
                } else {
                  setNotifications({ ...notif, boosts: false });
                }
              }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Midday and evening nudges that directly compare this week vs last week.
          </p>
        </div>

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

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <label className="relative inline-flex h-6 w-11 cursor-pointer items-center">
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="absolute inset-0 rounded-full bg-muted peer-checked:bg-primary transition-colors" />
      <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-background transition-transform peer-checked:translate-x-5" />
    </label>
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