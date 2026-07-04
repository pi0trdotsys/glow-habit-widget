import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Completion, Habit, HabitColor, HabitSchedule } from "./types";
import { todayKey } from "./utils";

export interface NotificationSettings {
  /** Master daily check-in reminder. */
  enabled: boolean;
  time: string; // "HH:mm"
  /** Weekly recap nudge comparing this week vs last week. */
  weeklyReport: boolean;
  /** Day of week for the weekly recap. 0 = Sunday ... 6 = Saturday. */
  reportDay: number;
  reportTime: string; // "HH:mm"
}

const defaultNotifications: NotificationSettings = {
  enabled: false,
  time: "20:00",
  weeklyReport: false,
  reportDay: 0, // Sunday
  reportTime: "19:00",
};

interface HabitsState {
  habits: Habit[];
  completions: Completion[];
  seeded: boolean;
  userName: string | null;
  setUserName: (name: string) => void;
  notifications: NotificationSettings;
  setNotifications: (n: NotificationSettings) => void;
  addHabit: (h: Omit<Habit, "id" | "createdAt">) => string;
  updateHabit: (id: string, patch: Partial<Omit<Habit, "id">>) => void;
  removeHabit: (id: string) => void;
  toggleCompletion: (habitId: string, date?: Date) => void;
  setCompletion: (habitId: string, dateKey: string, done: boolean) => void;
  isCompleted: (habitId: string, date?: Date) => boolean;
  exportData: () => string;
  importData: (json: string) => void;
  reset: () => void;
  ensureSeeded: () => void;
}

const seedHabits: Omit<Habit, "id" | "createdAt">[] = [
  { name: "Drink water", icon: "Droplet", color: "sky", schedule: { type: "daily" } },
  { name: "Move 30 min", icon: "Activity", color: "mint", schedule: { type: "daily" } },
  { name: "Read", icon: "BookOpen", color: "amber", schedule: { type: "daily" } },
  { name: "Meditate", icon: "Sparkles", color: "violet", schedule: { type: "daily" } },
  { name: "No junk food", icon: "Apple", color: "rose", schedule: { type: "weekdays", days: [0, 1, 2, 3, 4, 5] } },
  { name: "Gym", icon: "Dumbbell", color: "coral", schedule: { type: "timesPerWeek", target: 3 } },
];

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export const useHabits = create<HabitsState>()(
  persist(
    (set, get) => ({
      habits: [],
      completions: [],
      seeded: false,
      userName: null,
      setUserName: (name) => set({ userName: name.trim() || null }),
      notifications: defaultNotifications,
      setNotifications: (n) => set({ notifications: n }),
      addHabit: (h) => {
        const id = uid();
        const habit: Habit = { ...h, id, createdAt: new Date().toISOString() };
        set((s) => ({ habits: [...s.habits, habit] }));
        return id;
      },
      updateHabit: (id, patch) =>
        set((s) => ({
          habits: s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)),
        })),
      removeHabit: (id) =>
        set((s) => ({
          habits: s.habits.filter((h) => h.id !== id),
          completions: s.completions.filter((c) => c.habitId !== id),
        })),
      toggleCompletion: (habitId, date = new Date()) => {
        const key = todayKey(date);
        const exists = get().completions.some(
          (c) => c.habitId === habitId && c.date === key,
        );
        if (exists) {
          set((s) => ({
            completions: s.completions.filter(
              (c) => !(c.habitId === habitId && c.date === key),
            ),
          }));
        } else {
          set((s) => ({ completions: [...s.completions, { habitId, date: key }] }));
        }
      },
      setCompletion: (habitId, dateKey, done) => {
        const exists = get().completions.some(
          (c) => c.habitId === habitId && c.date === dateKey,
        );
        if (done && !exists) {
          set((s) => ({ completions: [...s.completions, { habitId, date: dateKey }] }));
        } else if (!done && exists) {
          set((s) => ({
            completions: s.completions.filter(
              (c) => !(c.habitId === habitId && c.date === dateKey),
            ),
          }));
        }
      },
      isCompleted: (habitId, date = new Date()) => {
        const key = todayKey(date);
        return get().completions.some(
          (c) => c.habitId === habitId && c.date === key,
        );
      },
      exportData: () =>
        JSON.stringify(
          { habits: get().habits, completions: get().completions },
          null,
          2,
        ),
      importData: (json) => {
        const data = JSON.parse(json) as {
          habits: Habit[];
          completions: Completion[];
        };
        set({ habits: data.habits ?? [], completions: data.completions ?? [], seeded: true });
      },
      reset: () => set({ habits: [], completions: [], seeded: false }),
      ensureSeeded: () => {
        if (get().seeded) return;
        const created: Habit[] = seedHabits.map((h) => ({
          ...h,
          id: uid(),
          createdAt: new Date().toISOString(),
        }));
        set({ habits: created, seeded: true });
      },
    }),
    {
      name: "loop-habits-v1",
      // Backfill any notification fields added after a user first persisted
      // (e.g. weeklyReport / reportTime) so older saves don't break.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<HabitsState>;
        return {
          ...current,
          ...p,
          notifications: { ...defaultNotifications, ...(p.notifications ?? {}) },
        };
      },
    },
  ),
);

export type { Habit, Completion, HabitColor, HabitSchedule };