import { addDays, differenceInCalendarDays, format, parseISO, startOfWeek } from "date-fns";
import type { Completion, Habit } from "./types";

export function todayKey(d: Date = new Date()): string {
  return format(d, "yyyy-MM-dd");
}

export function isDueOn(habit: Habit, date: Date): boolean {
  const s = habit.schedule;
  if (s.type === "daily") return true;
  if (s.type === "weekdays") {
    const days = s.days ?? [1, 2, 3, 4, 5];
    return days.includes(date.getDay());
  }
  // timesPerWeek — always "due" (user picks any day), tile shows weekly target
  return true;
}

export function isCompletedOn(
  habit: Habit,
  completions: Completion[],
  date: Date,
): boolean {
  const key = todayKey(date);
  return completions.some((c) => c.habitId === habit.id && c.date === key);
}

/** Current consecutive-day streak counting today (or yesterday if today not done). */
export function currentStreak(habit: Habit, completions: Completion[]): number {
  const setDates = new Set(
    completions.filter((c) => c.habitId === habit.id).map((c) => c.date),
  );
  let streak = 0;
  let cursor = new Date();
  // Allow grace: if today not done yet but yesterday was, still count from yesterday
  if (!setDates.has(todayKey(cursor))) {
    cursor = addDays(cursor, -1);
    if (!setDates.has(todayKey(cursor))) return 0;
  }
  while (true) {
    if (!isDueOn(habit, cursor)) {
      cursor = addDays(cursor, -1);
      continue;
    }
    if (setDates.has(todayKey(cursor))) {
      streak += 1;
      cursor = addDays(cursor, -1);
    } else {
      break;
    }
  }
  return streak;
}

export function longestStreak(habit: Habit, completions: Completion[]): number {
  const dates = completions
    .filter((c) => c.habitId === habit.id)
    .map((c) => parseISO(c.date))
    .sort((a, b) => a.getTime() - b.getTime());
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const d of dates) {
    if (prev && differenceInCalendarDays(d, prev) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/** Completions this calendar week (Mon–Sun). */
export function thisWeekCount(habit: Habit, completions: Completion[]): number {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const startKey = todayKey(start);
  return completions.filter(
    (c) => c.habitId === habit.id && c.date >= startKey,
  ).length;
}

/** Returns last `days` dates with completion booleans for the heatmap. */
export function heatmapData(
  habit: Habit,
  completions: Completion[],
  days = 84,
): { date: string; done: boolean }[] {
  const set = new Set(
    completions.filter((c) => c.habitId === habit.id).map((c) => c.date),
  );
  const out: { date: string; done: boolean }[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    out.push({ date: todayKey(d), done: set.has(todayKey(d)) });
  }
  return out;
}

/** Completion rate over last N days, considering schedule. */
export function completionRate(
  habit: Habit,
  completions: Completion[],
  days = 30,
): number {
  let due = 0;
  let done = 0;
  const set = new Set(
    completions.filter((c) => c.habitId === habit.id).map((c) => c.date),
  );
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = addDays(today, -i);
    if (!isDueOn(habit, d)) continue;
    due += 1;
    if (set.has(todayKey(d))) done += 1;
  }
  return due === 0 ? 0 : Math.round((done / due) * 100);
}