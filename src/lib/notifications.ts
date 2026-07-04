// Notifications engine. On the native Android app it uses
// @capacitor/local-notifications (real scheduled OS notifications that fire even
// when the app is closed). On the web it falls back to the Notification API with
// a lightweight in-page scheduler that only fires while a tab is open.
//
// Three kinds of reminder:
//   - a daily check-in                 (notifications.enabled / .time)
//   - per-habit reminders              (habit.reminder, "HH:mm")
//   - a weekly recap nudge             (notifications.weeklyReport / .reportDay / .reportTime)
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { LocalNotificationSchema } from "@capacitor/local-notifications";
import { useHabits } from "@/lib/habits/store";
import { weeklyReport } from "@/lib/habits/utils";

export type PermissionState = "granted" | "denied" | "default" | "unsupported";

// Reserved notification IDs. Per-habit ids are derived from the habit id and
// live above HABIT_ID_BASE so they never collide with the fixed ones.
const ID_DAILY = 1001;
const ID_WEEKLY = 2001;
const HABIT_ID_BASE = 100000;

const isNative = () => Capacitor.isNativePlatform();

export function notificationsSupported(): boolean {
  if (isNative()) return true;
  return typeof window !== "undefined" && "Notification" in window;
}

function habitNotifId(habitId: string): number {
  let h = 0;
  for (let i = 0; i < habitId.length; i++) h = (h * 31 + habitId.charCodeAt(i)) | 0;
  return HABIT_ID_BASE + (Math.abs(h) % 800000);
}

function parseTime(t: string | null | undefined): { hour: number; minute: number } {
  const [h, m] = (t || "20:00").split(":").map(Number);
  return { hour: Number.isFinite(h) ? h : 20, minute: Number.isFinite(m) ? m : 0 };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Encouraging weekly-recap body comparing this week to last week. */
function weeklyReportBody(): string {
  const { habits, completions, userName } = useHabits.getState();
  const who = userName ? `${userName}, ` : "";
  if (habits.length === 0) {
    return `${who}open Loop to set up your habits and start this week strong.`;
  }
  const d = weeklyReport(habits, completions).delta;
  const trend =
    d > 0
      ? "you've been ahead of last week - keep it going!"
      : d === 0
      ? "you're matching last week - can you pull ahead?"
      : "last week was stronger - let's beat it this week!";
  return `${who}${trend} Tap to compare this week vs last week.`;
}

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

export async function requestNotificationPermission(): Promise<PermissionState> {
  if (isNative()) {
    const res = await LocalNotifications.requestPermissions();
    return res.display === "granted" ? "granted" : "denied";
  }
  if (!notificationsSupported()) return "unsupported";
  const p = await Notification.requestPermission();
  return p === "granted" ? "granted" : p === "denied" ? "denied" : "default";
}

export async function getPermissionState(): Promise<PermissionState> {
  if (isNative()) {
    const res = await LocalNotifications.checkPermissions();
    return res.display === "granted"
      ? "granted"
      : res.display === "denied"
      ? "denied"
      : "default";
  }
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission as PermissionState;
}

// ---------------------------------------------------------------------------
// Native scheduling
// ---------------------------------------------------------------------------

async function cancelAllNative(): Promise<void> {
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length) {
    await LocalNotifications.cancel({
      notifications: pending.notifications.map((n) => ({ id: n.id })),
    });
  }
}

async function syncNative(): Promise<void> {
  const perm = await LocalNotifications.checkPermissions();
  await cancelAllNative();
  if (perm.display !== "granted") return;

  const { habits, notifications } = useHabits.getState();
  const schedule: LocalNotificationSchema[] = [];

  if (notifications.enabled) {
    const { hour, minute } = parseTime(notifications.time);
    schedule.push({
      id: ID_DAILY,
      title: "Loop",
      body: "Time to check in on your habits.",
      schedule: { on: { hour, minute } },
    });
  }

  for (const h of habits) {
    if (!h.reminder) continue;
    const { hour, minute } = parseTime(h.reminder);
    schedule.push({
      id: habitNotifId(h.id),
      title: "Loop reminder",
      body: `Time to: ${h.name}`,
      schedule: { on: { hour, minute } },
      extra: { habitId: h.id },
    });
  }

  if (notifications.weeklyReport) {
    const { hour, minute } = parseTime(notifications.reportTime);
    // Capacitor weekday is 1=Sunday .. 7=Saturday; our reportDay is 0=Sunday.
    const weekday = ((notifications.reportDay % 7) + 7) % 7 + 1;
    schedule.push({
      id: ID_WEEKLY,
      title: "Loop weekly recap",
      body: weeklyReportBody(),
      schedule: { on: { weekday, hour, minute } },
      extra: { route: "/report" },
    });
  }

  if (schedule.length) {
    await LocalNotifications.schedule({ notifications: schedule });
  }
}

// ---------------------------------------------------------------------------
// Web fallback (in-page minute scheduler; only fires while a tab is open)
// ---------------------------------------------------------------------------

let webTimer: ReturnType<typeof setInterval> | null = null;
let firedDate = "";
const firedKeys = new Set<string>();

function webTick(): void {
  if (Notification.permission !== "granted") return;
  const now = new Date();
  const dateKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  if (dateKey !== firedDate) {
    firedDate = dateKey;
    firedKeys.clear();
  }
  const hhmm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const { habits, notifications } = useHabits.getState();

  const fire = (key: string, title: string, body: string) => {
    if (firedKeys.has(key)) return;
    firedKeys.add(key);
    try {
      new Notification(title, { body, icon: "/icon-192.png", tag: key });
    } catch {
      /* ignore */
    }
  };

  if (notifications.enabled && notifications.time === hhmm) {
    fire("daily", "Loop", "Time to check in on your habits.");
  }
  for (const h of habits) {
    if (h.reminder && h.reminder === hhmm) {
      fire(`habit-${h.id}`, "Loop reminder", `Time to: ${h.name}`);
    }
  }
  if (
    notifications.weeklyReport &&
    notifications.reportTime === hhmm &&
    now.getDay() === notifications.reportDay
  ) {
    fire("weekly", "Loop weekly recap", weeklyReportBody());
  }
}

function syncWeb(): void {
  if (!notificationsSupported()) return;
  if (webTimer) {
    clearInterval(webTimer);
    webTimer = null;
  }
  if (Notification.permission !== "granted") return;
  webTimer = setInterval(webTick, 30000);
  webTick();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Reschedule every reminder from the current store state. Safe to call often. */
export async function syncNotifications(): Promise<void> {
  try {
    if (isNative()) await syncNative();
    else syncWeb();
  } catch {
    /* scheduling failures shouldn't crash the app */
  }
}
