let timer: ReturnType<typeof setTimeout> | null = null;

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return "denied";
  if (Notification.permission === "granted") return "granted";
  return Notification.requestPermission();
}

function msUntil(time: string): number {
  const [h, m] = time.split(":").map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(h ?? 20, m ?? 0, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

export function scheduleDailyReminder(time: string, body: string) {
  if (!notificationsSupported()) return;
  if (Notification.permission !== "granted") return;
  if (timer) clearTimeout(timer);
  const fire = () => {
    try {
      new Notification("Loop — daily check-in", {
        body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "loop-daily",
      });
    } catch {
      /* ignore */
    }
    // schedule next day
    timer = setTimeout(fire, 24 * 60 * 60 * 1000);
  };
  timer = setTimeout(fire, msUntil(time));
}

export function cancelDailyReminder() {
  if (timer) clearTimeout(timer);
  timer = null;
}