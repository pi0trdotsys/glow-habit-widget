// Bridges habit data between the web app and the native Android home-screen
// widget. Web data lives in zustand (localStorage); the native widget can only
// read Android SharedPreferences. @capacitor/preferences writes to the
// "CapacitorStorage" SharedPreferences file (keys stored raw), which the widget
// reads directly. No-op on web/PWA — only runs inside the native Capacitor app.
import { Capacitor, registerPlugin } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { useHabits } from "@/lib/habits/store";
import { isDueOn, todayKey } from "@/lib/habits/utils";
import type { HabitColor } from "@/lib/habits/types";

const STATE_KEY = "widget_state";
const PENDING_KEY = "widget_pending";

// Hex equivalents of the --habit-* oklch tokens (dark theme), so the native
// widget can render habit colors without any web/CSS logic.
const COLOR_HEX: Record<HabitColor, string> = {
  mint: "#59e0ad",
  coral: "#ff756f",
  amber: "#fdba2f",
  violet: "#b180fc",
  sky: "#55c4fe",
  rose: "#ff7d9c",
  lime: "#a9e85e",
  sand: "#d2b285",
};

interface HabitWidgetPlugin {
  refresh(): Promise<void>;
}
// Native plugin (android/.../HabitWidgetPlugin.java). Absent on web → calls no-op.
const HabitWidget = registerPlugin<HabitWidgetPlugin>("HabitWidget");

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

interface PendingOp {
  habitId: string;
  date: string;
  done: boolean;
}

function buildState() {
  const { habits, completions, userName } = useHabits.getState();
  const today = new Date();
  const key = todayKey(today);
  const due = habits.filter((h) => isDueOn(h, today));
  const rows = due.map((h) => ({
    id: h.id,
    name: h.name,
    colorHex: COLOR_HEX[h.color] ?? COLOR_HEX.mint,
    done: completions.some((c) => c.habitId === h.id && c.date === key),
  }));
  return {
    date: key,
    userName: userName ?? "",
    doneCount: rows.filter((r) => r.done).length,
    total: rows.length,
    habits: rows,
  };
}

async function mirror(): Promise<void> {
  await Preferences.set({ key: STATE_KEY, value: JSON.stringify(buildState()) });
  try {
    await HabitWidget.refresh();
  } catch {
    // plugin missing or no widget placed — fine
  }
}

// Drain widget taps queued while the app was closed. Ops carry the absolute
// desired state, so applying them via setCompletion is idempotent.
async function reconcile(): Promise<void> {
  const { value } = await Preferences.get({ key: PENDING_KEY });
  if (!value) return;
  let ops: PendingOp[] = [];
  try {
    ops = JSON.parse(value) as PendingOp[];
  } catch {
    ops = [];
  }
  if (ops.length) {
    const setCompletion = useHabits.getState().setCompletion;
    for (const op of ops) setCompletion(op.habitId, op.date, op.done);
  }
  await Preferences.remove({ key: PENDING_KEY });
}

let started = false;

export function startWidgetBridge(): void {
  if (started || !isNative()) return;
  started = true;

  // Apply any taps made on the widget, then publish current state.
  void reconcile().then(mirror);

  // Keep the widget in sync with every store change (debounced).
  let t: ReturnType<typeof setTimeout> | undefined;
  useHabits.subscribe(() => {
    if (t) clearTimeout(t);
    t = setTimeout(() => void mirror(), 200);
  });

  // When the app returns to the foreground, pull in widget taps.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void reconcile().then(mirror);
  });
}
